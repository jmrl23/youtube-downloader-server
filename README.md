# Youtube Downloader Server

Download videos from youtube in MP3 or MP4 format with the best quality available.

![https://github.com/jmrl23/youtube-downloader-server](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeHEyYWhoYmliZDdnOGllaGgycXd4YXgwdWlzODVqMWFmNHRkOXVrNCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/nj0XPti0kpg5i/giphy.gif)

## Installation

```bash
yarn # or npm install
```

- [Download yt-dlp](https://github.com/yt-dlp/yt-dlp/releases)
- Put the downloaded file inside the [.bin](.bin/) folder and name it `yt-dlp`

## Commands

| Command             | Description                                       |
| ------------------- | ------------------------------------------------- |
| yarn run build      | build                                             |
| yarn run start      | start (should run build first)                    |
| yarn run start:dev  | start in development mode (using swc)             |
| yarn run start:prod | start in production mode (should run build first) |
| yarn run format     | format code (using prettier)                      |
| yarn run lint       | lint code (using eslint)                          |
