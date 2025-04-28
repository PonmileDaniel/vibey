import React, { useState, useEffect } from 'react';
import './CreatorUpload.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import AlbumTrackFields from './AlbumTrackFields';

const CreatorUpload = () => {
  // Upload type state: 'track', 'album', 'my-tracks', 'my-albums'
  const [uploadType, setUploadType] = useState('track');

  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [audioFile, setAudioFile] = useState(null);

  // Upload status
  const [isUploading, setIsUploading] = useState(false);

  // Album track management
  const [albumTracks, setAlbumTracks] = useState([{ id: 1, title: '', audioFile: null }]);
  
  // User's uploaded content
  const [myTracks, setMyTracks] = useState([]);
  const [myAlbums, setMyAlbums] = useState([]);

  // Fetch previously uploaded tracks and albums on mount
  useEffect(() => {
    const fetchUploadedData = async () => {
      try {
        const config = {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data', timeout: 15000 },
        };

        // Fetch user's uploaded tracks
        const trackRes = await axios.get('http://localhost:5001/api/song/get-artist-track', config);
        setMyTracks(trackRes.data.tracks || []);

        // Fetch user's uploaded albums
        const albumRes = await axios.get('http://localhost:5001/api/song/get-artist-album', config);
        setMyAlbums(albumRes.data.albums || []);

      } catch (error) {
        toast.error('Failed to load your tracks and albums');
      }
    };

    fetchUploadedData();
  }, []);

  // Handle cover image upload
  const handleImageUpload = (e) => {
    if (e.target.files?.[0]) setCoverImage(e.target.files[0]);
  };

  // Handle audio file upload
  const handleAudioUpload = (e) => {
    if (e.target.files?.[0]) setAudioFile(e.target.files[0]);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields before upload
    if (uploadType === 'track') {
      if (!audioFile || !coverImage) {
        return toast.error('Audio file and cover Image are required!');
      }
    } else {
      const hasInvalidTrack = albumTracks.some(track => !track.audioFile || !track.title);
      if (!coverImage || hasInvalidTrack) {
        return toast.error('All album tracks need title & audio, and cover is required!');
      }
    }

    // Prepare FormData for upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('image', coverImage);

    if (uploadType === 'album') {
      formData.append('albumName', title);
      albumTracks.forEach(track => formData.append('tracks', track.audioFile));
      formData.append('trackTitles', JSON.stringify(albumTracks.map(t => t.title)));
    } else {
      formData.append('audio', audioFile);
    }

    try {
      setIsUploading(true);

      const config = {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data', timeout: 15000 },
      };

      // Set endpoint based on upload type
      const endpoint = uploadType === 'album'
        ? 'http://localhost:5001/api/song/upload-album'
        : 'http://localhost:5001/api/song/upload';

      // Upload to server
      const res = await axios.post(endpoint, formData, config);

      // Handle successful upload
      if (res.status === 201) {
        toast.success(`${uploadType === 'track' ? 'Track' : 'Album'} uploaded successfully!`);
        setTitle('');
        setDescription('');
        setCoverImage(null);
        setAudioFile(null);
        setAlbumTracks([{ id: 1, title: '', audioFile: null }]);
      }
    } catch (error) {
      console.error(error);
      // Handle errors
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error. Please check your internet.');
      } else if (error.response) {
        toast.error(error.response.data.message || 'Upload failed');
      } else {
        toast.error('Unknown error. Try again later.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="cu-page">
      <div className="cu-container">
        {/* Header Section */}
        <div className="cu-header">
          <div className="cu-title">Upload Your Music</div>
          <div className="cu-subtitle">Share your AI-generated creations with the world</div>
        </div>

        {/* Main Upload Section */}
        <div className="cu-upload-container">

          {/* Toggle buttons for switching views */}
          <div className="cu-toggle-container">
            <div
              className={`cu-toggle-button ${uploadType === 'track' ? 'active' : ''}`}
              onClick={() => setUploadType('track')}
            >
              Single Track
            </div>

            <div
              className={`cu-toggle-button ${uploadType === 'album' ? 'active' : ''}`}
              onClick={() => setUploadType('album')}
            >
              Album
            </div>

            <div
              className={`cu-toggle-button ${uploadType === 'my-tracks' ? 'active' : ''}`}
              onClick={() => setUploadType('my-tracks')}
            >
              My Tracks
            </div>

            <div
              className={`cu-toggle-button ${uploadType === 'my-albums' ? 'active' : ''}`}
              onClick={() => setUploadType('my-albums')}
            >
              My Albums
            </div>
          </div>

          {/* Upload form */}
          <form onSubmit={handleSubmit}>
            {(uploadType === 'track' || uploadType === 'album') ? (
              <>
                {/* Title input */}
                <div className="cu-form-group">
                  <label className="cu-label">{uploadType === 'track' ? 'Track Title' : 'Album Title'}</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title"
                    className="cu-input"
                    required
                  />
                </div>

                {/* Description input */}
                <div className="cu-form-group">
                  <label className="cu-label">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description..."
                    className="cu-textarea"
                    required
                  />
                </div>

                {/* Cover Image upload */}
                <div className="cu-form-group">
                  <label className="cu-label">Cover Image</label>
                  <div className="cu-file-upload" onClick={() => document.getElementById('coverImageInput').click()}>
                    <input
                      type="file"
                      accept="image/*"
                      id="coverImageInput"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="cu-file-upload-text">Click to upload image</div>
                    {coverImage && <div className="cu-file-selected">Selected: {coverImage.name}</div>}
                  </div>
                </div>

                {/* Audio File or Album Tracks */}
                {uploadType === 'track' ? (
                  <div className="cu-form-group">
                    <label className="cu-label">Audio File</label>
                    <div className="cu-file-upload" onClick={() => document.getElementById('audioFileInput').click()}>
                      <input
                        type="file"
                        accept="audio/*"
                        id="audioFileInput"
                        onChange={handleAudioUpload}
                        style={{ display: 'none' }}
                      />
                      <div className="cu-file-upload-text">Click to upload audio file</div>
                      {audioFile && <div className="cu-file-selected">Selected: {audioFile.name}</div>}
                    </div>
                  </div>
                ) : (
                  // Album multiple track inputs
                  <AlbumTrackFields albumTracks={albumTracks} setAlbumTracks={setAlbumTracks} />
                )}

                {/* Submit button */}
                <button type="submit" className="cu-submit-button" disabled={isUploading}>
                  {isUploading
                    ? `Uploading ${uploadType === 'track' ? 'Track' : 'Album'}...`
                    : `Upload ${uploadType === 'track' ? 'Track' : 'Album'}`}
                </button>
              </>
            ) : (
              // My Tracks or My Albums board
              <div className='cu-board'>

                {/* My Tracks list */}
                {uploadType === 'my-tracks' && (
                  <div className="cu-my-tracks">
                    <h3>My Tracks</h3>
                    <ul>
                      {myTracks && myTracks.length > 0 ? (
                        myTracks.map(track => (
                          <li key={track._id}>
                            <div>{track.trackName}</div>
                            <audio controls>
                              <source src={track.audioUrl} type="audio/mp3" />
                              Your browser does not support the audio element.
                            </audio>
                          </li>
                        ))
                      ) : (
                        <div>No tracks available</div>
                      )}
                    </ul>
                  </div>
                )}

                {/* My Albums list */}
                {uploadType === 'my-albums' && (
                  <div className="cu-my-albums">
                    <h3>My Albums</h3>
                    <ul className="album-list">
                      {myAlbums.map(album => (
                        <li key={album._id} className="album-item">
                          <div className="album-info">
                            {/* Album Cover */}
                            {album.coverImageUrl && (
                              <img
                                src={album.coverImageUrl}
                                alt={album.albumName}
                                className="album-cover"
                              />
                            )}
                            <div>
                              <h4>{album.albumName}</h4>
                              {/* Number of tracks */}
                              {album.tracks && (
                                <p>{album.tracks.length} Tracks</p>
                              )}
                              {/* Created date */}
                              {album.createdAt && (
                                <p className="album-date">
                                  {new Date(album.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
};

export default CreatorUpload;
