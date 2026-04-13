# Recipe Finder Web App

A responsive recipe search app built with HTML, CSS, and JavaScript. It uses TheMealDB API to search meals, open recipe details in a modal, and save favorites in `localStorage`.

## Features

- Search recipes by name
- Fetch meal data from TheMealDB
- View ingredients and instructions in a popup
- Add and remove favorites
- Persist favorites with `localStorage`
- Toggle dark and light theme
- Responsive layout for desktop and mobile

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6+)
- Fetch API
- LocalStorage
- TheMealDB API

## Project Structure

```text
recipe-app/
|-- index.html
|-- style.css
|-- script.js
|-- Dockerfile
|-- nginx.conf
|-- .dockerignore
`-- README.md
```

## Run Locally With Docker

Build the image:

```bash
docker build -t recipe-app .
```

Run the container:

```bash
docker run -d -p 8080:80 --name recipe-app recipe-app
```

Open the app at `http://localhost:8080`.

## Azure Deployment Notes

This project is containerized for Azure App Service or any other Azure container host.

1. Build and push the image to a registry such as Azure Container Registry:

```bash
docker build -t <registry-name>.azurecr.io/recipe-app:latest .
docker push <registry-name>.azurecr.io/recipe-app:latest
```

2. In Azure App Service, configure the app to use that image.

3. Set the app setting `WEBSITES_PORT` to `80` so Azure routes traffic to the nginx container correctly.

## Author

Sameer Khuhro
