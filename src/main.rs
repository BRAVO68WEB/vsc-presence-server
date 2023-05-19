use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::sync::mpsc;
use tokio::time::{self, Duration};
use tokio::net::{TcpListener, TcpStream};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use serde::{Deserialize, Serialize};
use serde_json;
use redis::{Client, aio::Connection};
use futures::{SinkExt, StreamExt};
use std::future::Future;
use std::pin::Pin;
use redis::AsyncCommands;

#[derive(Debug, Serialize, Deserialize)]
enum MessageType {
    Presence,
    Heartbeat,
}

#[derive(Debug, Serialize, Deserialize)]
struct Presence {
    // Add your presence structure fields here
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Redis configuration
    let redis_client = Client::open("redis://localhost")?;
    let redis_conn = redis_client.get_async_connection().await?;

    // WebSocket listener
    let listener = TcpListener::bind("127.0.0.1:3000").await?;
    let mut incoming = listener.incoming();

    while let Some(stream) = incoming.next().await {
        let stream = stream?;
        let redis_conn = redis_conn.clone();

        tokio::spawn(async move {
            if let Err(e) = handle_connection(stream, redis_conn).await {
                eprintln!("Error handling connection: {}", e);
            }
        });
    }

    Ok(())
}

async fn handle_connection(stream: TcpStream, redis_conn: Arc<RwLock<Connection>>) -> Result<(), Box<dyn std::error::Error>> {
    let (reader, writer) = stream.into_split();
    let (tx, mut rx) = mpsc::channel(32);
    let redis_conn = Arc::clone(&redis_conn);

    // Spawn a task to read messages from the WebSocket
    tokio::spawn(async move {
        let mut reader = tokio::io::BufReader::new(reader);

        loop {
            let mut buf = vec![0; 4096];
            match reader.read(&mut buf).await {
                Ok(0) => break,
                Ok(n) => {
                    let message = buf[..n].to_vec();
                    if tx.send(message).await.is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    });

    // Process WebSocket messages
    while let Some(message) = rx.recv().await {
        let mut redis_conn = redis_conn.write().await;

        let message_str = String::from_utf8_lossy(&message);
        let parsed_message: Result<(MessageType, String, Presence), serde_json::Error> = serde_json::from_str(&message_str);

        if let Ok((msg_type, pubkey, presence)) = parsed_message {
            match msg_type {
                MessageType::Presence => {
                    let presence_str = serde_json::to_string(&presence)?;
                    redis_conn.set(format!("presence_{}", pubkey), presence_str).await?;
                }
                MessageType::Heartbeat => {
                    let timestamp = format!("{}", chrono::Utc::now().timestamp());
                    redis_conn.setex(format!("heartbeat_{}", pubkey), 10, timestamp).await?;
                }
            }
        } else {
            eprintln!("Failed to parse message: {}", message_str);
        }
    }

    Ok(())
}
