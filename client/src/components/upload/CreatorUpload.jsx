import React, { useState, useEffect } from 'react';
import './CreatorUpload.css'; // Import component-specific CSS
import axios from 'axios'; // For making API requests
import toast from 'react-hot-toast'; // For displaying error/success notifications
import AlbumTrackFields from './AlbumTrackFields'; // (Used in UploadForm so do not remove it )
import UploadForm from './UploadForm'; // Reusable upload form for track or album
import { Trash2, X, RefreshCw } from 'lucide-react';



const apiSongUrl=import.meta.env.VITE_API_URL_SONG

const CreatorUpload = () => {
  // State to control the current selected upload type/view
  const [uploadType, setUploadType] = useState('track');

  // State to hold fetched tracks and albums
  const [myTracks, setMyTracks] = useState([]);
  const [myAlbums, setMyAlbums] = useState([]);

  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);

  // State for delete confirmation modal
  const [deleteTrackIds, setDeleteTrackIds] = useState([]);


  const handleDeleteTrack = async (trackId) => {
    try {
      // Add this track to the deleting state
      setDeleteTrackIds(prev => [...prev, trackId]);


      await axios.delete(`${apiSongUrl}/delete-track/${trackId}`, {
        withCredentials: true,
      });

      // Remove the track from state to update UI immediately
      setMyTracks(prev => prev.filter(track => track._id !== trackId));

      toast.success('Track deleted Successfully')
      setMyTracks(prev => prev.filter(track => track._id !== trackId))
    } catch (error) {
      toast.error('Failed to delete track');
      console.error(error);
    } finally{
      // Remove this track from the deleting state
      setDeleteTrackIds(prev => prev.filter(id => id !== trackId));
    }
  };

  //Function to fetch data with loading state
  const fetchUploadedData = async () => {
      setIsLoading(true)
      try {
        const config = {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data', timeout: 15000 },
        };

        // Fetch uploaded single tracks
        const trackRes = await axios.get(`${apiSongUrl}/get-artist-track`, config);
        setMyTracks(trackRes.data.tracks || []);

        // Fetch uploaded albums
        const albumRes = await axios.get(`${apiSongUrl}/get-artist-album`, config);
        setMyAlbums(albumRes.data.albums || []);

        toast.success('Content refreshed')
      } catch (error) {
        // Notify user if API call fails
        toast.error('Failed to load your tracks and albums');
      } finally{
        setIsLoading(false);
      }
    };


  // Fetch creator's uploaded tracks and albums when component mounts
  useEffect(() => {
    fetchUploadedData();
  }, []);

  return (
    <div className="cu-page">
      <div className="cu-container">
        {/* Header section */}
        <div className="cu-header">
          <div className="cu-title">Upload Your Music</div>
          <div className="cu-subtitle">Share your AI-generated creations with the world</div>
        </div>

        {/* Toggle section for switching views */}
        <div className="cu-upload-container">
          <div className="cu-toggle-container">
            {['track', 'album', 'my-tracks', 'my-albums'].map((type) => (
              <div
                key={type}
                className={`cu-toggle-button ${uploadType === type ? 'active' : ''}`}
                onClick={() => setUploadType(type)}
              >
                {type === 'track'
                  ? 'Single Track'
                  : type === 'album'
                  ? 'Album'
                  : type === 'my-tracks'
                  ? 'My Tracks'
                  : 'My Albums'}
              </div>
            ))}
          </div>

          {/* Render upload form or uploaded content based on selected view */}
          {uploadType === 'track' || uploadType === 'album' ? (
            // Upload form for either track or album
            <UploadForm uploadType={uploadType} />
          ) : (
            // Display uploaded tracks or albums
            <div className="cu-board">
              {/* My Tracks view */}
              {uploadType === 'my-tracks' && (
                <div className="cu-my-tracks">
                  <h3>My Tracks</h3>
                  <ul>
                    {myTracks.length > 0 ? (
                      myTracks.map((track) => (
                        <li key={track._id}>
                          <div>{track.trackName}</div>
                          <div className='cu-track-control'>
                          <audio controls preload="auto">
                            <source src={track.audioUrl} type="audio/mp3" />
                            Your browser does not support the audio element.
                          </audio>
                          <button 
                          className={`delete-button ${deleteTrackIds.includes(track._id) ? 'deleting' : ''}`} 
                          onClick={() => handleDeleteTrack(track._id, track.trackName)}
                          disabled={deleteTrackIds.includes(track._id)}
                          >
                            {deleteTrackIds.includes(track._id) ? (
                                  <RefreshCw size={20} className="rotating" />
                                ) : (
                                  <Trash2 size={20} color="red" />
                                )}
                          </button>
                          </div>
                        </li>
                      ))
                    ) : (
                      <div>No tracks available</div>
                    )}
                  </ul>
                </div>
              )}

              {/* My Albums view */}
              {uploadType === 'my-albums' && (
                <div className="cu-my-albums">
                  <h3>My Albums</h3>
                  <ul className="album-list">
                    {myAlbums.map((album) => (
                      <li key={album._id} style={{ listStyle: 'none' }}>
                        <div className="album-item">
                          {/* Album cover image */}
                          {album.imageUrl && (
                            <img src={album.imageUrl} className="album-cover" />
                          )}
                          {/* Album metadata */}
                          <div className="album-info">
                            <h4>{album.albumName}</h4>
                            {album.tracks && <p>{album.tracks.length} Tracks</p>}
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
        </div>
      </div>
    </div>
  );
};

export default CreatorUpload;
