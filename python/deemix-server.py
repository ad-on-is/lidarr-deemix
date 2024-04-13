from os import environ
from deezer import Deezer
from pathlib import Path

from deemix import generateDownloadObject
from deemix.__main__ import LogListener
from deemix.utils import getBitrateNumberFromText
from deemix.settings import load as loadSettings
from deemix.downloader import Downloader

from flask import Flask
from flask import request

app = Flask(__name__)

listener = LogListener()
local_path = Path('.')
config_folder = local_path / 'config'
settings = loadSettings(config_folder)

arl = environ.get('DEEMIX_ARL')
# arl = 'ARL'

dz = Deezer()
dz.login_via_arl(arl)


def get_search_params():
    return request.args.get('q'), request.args.get('offset'), request.args.get('limit')


@app.route('/search')
def search():
    (query, offset, limit) = get_search_params()
    return dz.api.search_track(query=query, index=offset, limit=limit)


@app.route('/search/artists')
def search_artists():
    (query, offset, limit) = get_search_params()
    return dz.api.search_artist(query=query, index=offset, limit=limit)


@app.route('/search/albums')
def search_albums():
    (query, offset, limit) = get_search_params()
    return dz.api.search_album(query=query, index=offset, limit=limit)


@app.route('/search/advanced')
def advanced_search():
    (query, offset, limit) = get_search_params()
    return dz.api.advanced_search(
        track=request.args.get('track'),
        artist=request.args.get('artist'),
        album=request.args.get('album'),
        index=offset,
        limit=limit
    )


@app.route('/albums/<album_id>')
def album(album_id):
    return dz.api.get_album(album_id)


@app.route('/artists/<artist_id>')
def artist(artist_id):
    artist = dz.api.get_artist(artist_id)
    artist.update(artist | {'top': dz.api.get_artist_top(artist_id, limit=100)})
    artist.update(artist | {'albums': dz.api.get_artist_albums(artist_id, limit=200)})
    return artist


@app.route('/artists/<artist_id>/top')
def artist_top(artist_id):
    return dz.api.get_artist_top(artist_id, limit=100)

@app.route('/album/<album_id>/tracks')
def album_tracks(album_id):
    return dz.api.get_album_tracks(album_id)


@app.route('/artists/<artist_id>/albums')
def artist_albums(artist_id):
    return dz.api.get_artist_albums(artist_id, limit=200)


@app.route('/dl/<type>/<object_id>', defaults={'bitrate': 'flac'})
@app.route('/dl/<type>/<object_id>/<bitrate>')
def download(type, object_id, bitrate):
    bitrate = getBitrateNumberFromText(bitrate)
    track = generateDownloadObject(dz, f"https://www.deezer.com/us/{type}/{object_id}", bitrate)
    Downloader(dz, track, settings, listener).start()
    return track.toDict()


if __name__ == '__main__':
    from waitress import serve
    print("DeemixApiHelper running at http://0.0.0.0:7272")
    serve(app, host="0.0.0.0", port=7272)
