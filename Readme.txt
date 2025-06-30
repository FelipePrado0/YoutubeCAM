# YoutubeCAM UserScript

A UserScript to search for music on YouTube and display it in a popup on `app.camkrolik.com.br`.

## Features

*   Adds a YouTube search button to the `app.camkrolik.com.br` interface.
*   Allows searching for videos and playlists.
*   Displays search results in a side panel.
*   Plays selected videos or playlists in a fixed player at the top right of the page.
*   Initial search term is pre-filled with the contact's name (if available) or "Músicas".

### TODO

*   Keep the search bar visible after clicking on a video.
*   Allow selection of playlists (currently implemented for search, playback might need review).
*   Display the playlist order, upcoming songs, and allow navigation to previous/next songs.
*   Show song lyrics if available.

## Installation

1.  **Install a UserScript Manager**: You need a browser extension that can manage UserScripts. Popular choices include:
    *   [Tampermonkey](https://www.tampermonkey.net/) (for Chrome, Firefox, Edge, Safari, Opera)
    *   [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) (for Firefox)
    *   Violentmonkey (for Chrome, Firefox, Edge, Opera)
2.  **Install the Script**:
    *   Open your UserScript manager's dashboard.
    *   Create a new script.
    *   Copy the entire content of the `YoutubeCAM.user.js` file.
    *   Paste it into the new script editor in your UserScript manager.
    *   Save the script. It should automatically activate on `https://app.camkrolik.com.br/*`.

## Usage

1.  Navigate to `https://app.camkrolik.com.br/`.
2.  After a few seconds, a YouTube icon button (initially an Umbrella Corp logo as per the script) will appear in the top bar, typically within a `div.jss24.flex.flex-col` section.
3.  Click the YouTube icon button. This will open a side panel on the right.
4.  The script will automatically perform an initial search. If a contact name is visible in the header (`header span[title]`), that name will be used as the search term. Otherwise, it defaults to "Músicas".
5.  In the side panel:
    *   Use the search bar to enter your desired song or artist.
    *   Select whether you want to search for "Vídeo" (Video) or "Playlist".
    *   Click the "Buscar" (Search) button.
6.  Search results will be displayed below the search bar.
7.  Click on any search result (video or playlist) to start playing it in the fixed player at the top right of the screen.
8.  To close the side panel, click the "×" button at the top right of the panel. The player will also be hidden. Clicking the YouTube icon button again will reopen the panel.

## Configuration

### YouTube API Key

The script uses a YouTube Data API v3 key to search for videos and playlists.

The current key in the script is:
`const YOUTUBE_API_KEY = 'AIzaSyAcl9uhYqUJ2H1aU_CzF1fDXWA7A9fenrI';`

**Important**: API keys have quotas and restrictions. If the script stops working or shows API-related errors, this key might have reached its limit or been disabled.

**To obtain your own YouTube Data API v3 key:**

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (or select an existing one).
3.  Enable the "YouTube Data API v3" for your project:
    *   Go to "APIs & Services" > "Library".
    *   Search for "YouTube Data API v3" and enable it.
4.  Create credentials for the API:
    *   Go to "APIs & Services" > "Credentials".
    *   Click "Create Credentials" > "API key".
    *   Copy the generated API key.
    *   **It is highly recommended to restrict your API key** to prevent unauthorized use. You can restrict it to specific APIs (YouTube Data API v3) and, if possible, by IP address or HTTP referrers (though this is harder for UserScripts).
5.  Replace the `YOUTUBE_API_KEY` value in the script with your new key.

## Contributing

Contributions are welcome! If you have improvements or bug fixes:

1.  Fork the repository (if applicable, or simply modify your local script).
2.  Make your changes.
3.  Test your changes thoroughly.
4.  Suggest your changes (e.g., by creating a Pull Request or sharing your modified script).

Please ensure your code is clear and follows the existing style.

## License

This UserScript is provided as-is. You are free to use, modify, and distribute it. Please refer to the original author (Felipe Prado) if re-distributing. No formal license is attached, but standard open-source community practices are encouraged.