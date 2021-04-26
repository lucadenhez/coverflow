# coverflow

A website to bring back the iTunes original cover flow!

# Original Code

The actual _CSS_ and _JavaScript_ code to create the beautiful cover flow was created by **Matt Doyle in 2011**. What I coded into this is retrieving **actual library information from Apple Music,** and composing the cover flow full of the last 25 albums/songs you've listened to, each one with a clickable link to the album/song.

# To Do's

**- Live Playback:** I doubt this is going to happen to due _DRM_ and audio streaming, so for the meantime I made each artwork **clickable** to redirect to the album/song, or you can just press **enter** while the album/song is focused.

# Instructions

1. Go to [https://apple.music.com](https://apple.music.com)
2. Log in.
3. Open Chrome DevTools with **Ctrl + Shift + i** on Windows or **Cmd + Alt + i** on Mac.
4. Go to the network tab in the DevTools, then go to your recently added on Apple Music.
5. Once you see an entry in the Network Inspector that looks something along the lines as **recently-added?l=en-us&platform=web&includ...**, choose the second one, (A **GET** request, not an options) then pause the recording.
6. Click on the entry, go to request headers, then copy and write down the _authorization_, copy everything **after the 'Bearer ',** no trailing whitespaces. And also copy the _media-user-token_.
7. Now head over to my website [https://lucadenhez.github.io/coverflow](https://lucadenhez.github.io/coverflow), and enter the information.
8. Once you press **Submit** and it still shows the login screen, that means the information you copied is wrong, you're rate limited, or my code is bugged. (Let me know on Discord)

**If all works, have fun with the nostalgia!**

# Discord

**lucaa#4787**
