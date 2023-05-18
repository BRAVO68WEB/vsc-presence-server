## `INDEV`

# Visual Studio Code Presence Server
> ## vs-presence-server

![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/BRAVO68WEB/vsc-presence-server/build-image-upload.yaml?label=DOCKER%20IMAGE%20BUILDS&logo=docker&style=for-the-badge)


![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/BRAVO68WEB/vsc-presence-server/build-n-test.yaml?branch=main&label=Main%20Builds&style=for-the-badge&logo=typescript)
![GitHub Workflow Status (with branch)](https://img.shields.io/github/actions/workflow/status/BRAVO68WEB/vsc-presence-server/build-n-test.yaml?branch=dev&label=DEV%20Builds&style=for-the-badge&logo=typescript)

## Description

This is a server that allows you to project your vscode presence to a custom rich presence server.

## Installation

1. Clone the repository.
2. Install the dependencies by running `npm install` in your terminal.
3. Start the server by running `npm start` in your terminal.
4. You're done!

## Configuration

- Create a `.env` file in the root directory of the project with help of the `.env.example` file.

## Usage

1. Register your account on the server by sending a `GET` request to `/register` with the following query:

```json
{
    "email": "you@email.com"
}
```

2. You will receive data in the following format:

```json
{
    "success": true,
    "fetchkey": "dGVzdEB0ZXN0Lm9yZw==",
    "publisherkey": "15vqw0jlyx4olgf0ropvdh"
}
```

3. Save the `publisherkey` in your vscode plugin settings and start the plugin.

4. Now you can send a `GET` request to `/presence/$fetchkey` with the following params:

```json
{
    "fetchkey": "dGVzdEB0ZXN0Lm9yZw=="
}
```

5. You will receive data in the following format:

```json
{
    "data": {
        "details": "/home/bravo68web/Projects/Test/Back_End/models/schemas.py | Back_End",
        "state": "python | 8:13",
        "largeImageKey": "vscode",
        "largeImageText": "Visual Studio Code",
        "smallImageKey": "python",
        "smallImageText": "python",
        "startTimestamp": 1684383448778,
        "timeDiff": 6540,
        "text": "",
        "currentTimestamp": 1684383455318,
        "iconURL": "https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/main/icons/python.svg"
    }
}
```

6. You can now use the data to display the rich presence in your application.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you like my work, consider supporting me on [Github Sponsors](https://github.com/sponsors/BRAVO68WEB/)

## Credits

- [BRAVO68WEB](https://github.com/BRAVO68WEB)