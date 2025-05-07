import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './listener.css';
import './AlbumsView.css';
import ArtistsView from './ArtistsView'; // Import the ArtistsView component

import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle,
  ChevronLeft
} from 'lucide-react';

const Listener = () => {
  // State declarations
  const [activeView, setActiveView] = useState('discover');
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [popularTracks, setPopularTracks] = useState([]);
  const [allTracks, setAllTracks] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  
  // Album states
  const [albums, setAlbums] = useState([]);
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumsLoading, setAlbumsLoading] = useState(true);
  const [albumsError, setAlbumsError] = useState(null);

  const navigate = useNavigate();
  const audioRef = useRef(new Audio());

  // Helper function for creating unique track identifiers
  const getTrackIdentifier = (track, index) => {
    // Use a combination of trackName and artistName as a unique identifier
    return `${track.trackName}-${track.artistName || track.artistId?.name || 'unknown'}-${track._id || track.createdAt || index}`;
  };

  // Volume control functions
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  const toggleMute = () => {
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };
  
  // Track navigation functions
  const playPrevious = () => {
    if (currentTrack) {
      const currentIdentifier = getTrackIdentifier(currentTrack);
      const currentIndex = allTracks.findIndex(track => getTrackIdentifier(track) === currentIdentifier);
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : allTracks.length - 1;
      handleTrackClick(allTracks[previousIndex]);
    }
  };
  
  const playNext = () => {
    if (currentTrack) {
      const currentIdentifier = getTrackIdentifier(currentTrack);
      const currentIndex = allTracks.findIndex(track => getTrackIdentifier(track) === currentIdentifier);
      const nextIndex = currentIndex < allTracks.length - 1 ? currentIndex + 1 : 0;
      handleTrackClick(allTracks[nextIndex]);
    }
  };
  
  // Player mode functions
  const toggleShuffle = () => {
    setIsShuffling(!isShuffling);
  };
  
  const toggleRepeat = () => {
    setIsRepeating(!isRepeating);
  };

  // Fetch tracks from the API
  const fetchTracks = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/song/get-tracks');
      if (response.data.success) {
        setPopularTracks(response.data.tracks);
        setAllTracks(response.data.tracks);
      } else {
        console.error('Failed to fetch tracks:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  // Fetch all albums from API
  const fetchAlbums = async () => {
    try {
      setAlbumsLoading(true);
      const response = await axios.get('http://localhost:5001/api/song/get-albums');
      if (response.data.success) {
        setAlbums(response.data.albums);
      } else {
        setAlbumsError('Failed to fetch albums');
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
      setAlbumsError('Error loading albums. Please try again later.');
    } finally {
      setAlbumsLoading(false);
    }
  };

  // Helper function to check if two tracks are the same
  const isSameTrack = (track1, track2) => {
    return track1 && track2 && 
      track1.trackName === track2.trackName && 
      (track1.artistName === track2.artistName || 
       track1.artistId?._id === track2.artistId?._id);
  };

  const handleTrackClick = (track) => {
    // First check if we're dealing with the same track using our helper function
    if (currentTrack && isSameTrack(currentTrack, track)) {
      // For the same track, just toggle play state
      setIsPlaying(!isPlaying);
      return;
    }
    
    // For a different track
    // 1. First update the state with isPlaying = false to properly pause any current audio
    setIsPlaying(false);

    // 2. Use a slight delay to ensure the pause takes effect
    setTimeout(() => {
      // 3. Reset and Update audio
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;

      //4. Update track state first
      setCurrentTrack({...track});

      //5. Only then Update the audio source
      audio.src = track.audioUrl;

      //6. Set up a proper load and play sequence with proper error handling
      const playWhenReady = () => {
        // Remove the event listener to prevent multiple triggers
        audio.removeEventListener('canplaythrough', playWhenReady);

        // Set playing state to true and then play
        setIsPlaying(true);

        // Small delay to ensure React State is updated
        setTimeout(() => {
          const playPromise = audio.play();

          // Handle the play promise properly
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Successfully playing new track:", track.trackName);
              })
              .catch(error => {
                console.error("Error playing new track:", error);
                // Only update state if this still the current track
                if (isSameTrack(currentTrack, track)) {
                  setIsPlaying(false);
                }
              });
          }
        }, 50);
      };
      
      // Set up event listener for when audio can play
      audio.addEventListener('canplaythrough', playWhenReady);
      
      // Force load to trigger the canplaythrough event
      audio.load();
    }, 50); // Short delay to ensure pause completes
  };

  // Helper functions for UI
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Handle album selection
  const handleAlbumClick = (album) => {
    setSelectedAlbum(album);
  };

  // Go back from album detail view to albums list
  const handleBackFromAlbum = () => {
    setSelectedAlbum(null);
  };

  // Initialize and fetch data - FIXED to not stop music when changing views
  useEffect(() => {
    // Initial data fetch when component mounts
    fetchTracks();
  }, []); // Empty dependency array - only run once on mount

  // Separate effect for fetching albums when switching to albums view
  useEffect(() => {
    if (activeView === 'albums') {
      fetchAlbums();
    }
  }, [activeView]);

  // Audio cleanup - only when component unmounts
  useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.src = '';
    };
  }, []); // Empty dependency array means this only runs on unmount

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (isRepeating) {
        audio.currentTime = 0;
        audio.play();
      } else if (isShuffling) {
        const randomIndex = Math.floor(Math.random() * allTracks.length);
        handleTrackClick(allTracks[randomIndex]);
      } else {
        playNext();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isRepeating, isShuffling, allTracks, playNext, handleTrackClick]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      // If we should be playing, try to play
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        setIsPlaying(false);
      });
    } else {
      // Otherwise pause
      audio.pause();
    }
  }, [isPlaying]); // Only depend on isPlaying, not currentTrack

  // View rendering functions
  const renderDiscoverView = () => (
    <div className="discover-view">
      <section>
        <h2 className="section-title">Popular Tracks</h2>
        <div className="track-list">
          {popularTracks.map((track, index) => (
            <div
              key={getTrackIdentifier(track, index)}
              className={`track-item ${currentTrack && getTrackIdentifier(currentTrack) === getTrackIdentifier(track) ? 'active' : ''}`}
              onClick={() => handleTrackClick(track)}
            >
              <div className="track-index">{index + 1}</div>
              <div className="track-image">
                <img src={track.imageUrl || 'https://via.placeholder.com/200'} alt={track.trackName} />
              </div>
              <div className="track-info">
                <h3 className="track-title">{track.trackName}</h3>
                <p className="track-artist">{track.artistName || track.artistId?.name || 'Unknown Artist'}</p>
              </div>
              <div className="track-duration">{new Date(track.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  const renderTracksView = () => (
    <div className="tracks-view">
      <h2 className="section-title">All Tracks</h2>
      <div className="track-list">
        {allTracks.map((track, index) => (
          <div
            key={getTrackIdentifier(track, index)}
            className={`track-item ${currentTrack && getTrackIdentifier(currentTrack) === getTrackIdentifier(track, index) ? 'active' : ''}`}
            onClick={() => handleTrackClick(track)}
          >
            <div className="track-index">{index + 1}</div>
            <div className="track-image">
              <img src={track.imageUrl || 'https://via.placeholder.com/200'} alt={track.trackName} />
            </div>
            <div className="track-info">
              <h3 className="track-title">{track.trackName}</h3>
              <p className="track-artist">{track.artistName || track.artistId?.name || 'Unknown Artist'}</p>
            </div>
            <div className="track-duration">{new Date(track.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );

  // Check if a track is currently playing
  const isTrackPlaying = (track) => {
    return currentTrack && 
           currentTrack.trackName === track.trackName && 
           isPlaying;
  };

  // Render the albums grid view
  const renderAlbumsGrid = () => (
    <div className="albums-grid">
      {albums.map((album) => (
        <div 
          key={album._id} 
          className="album-card" 
          onClick={() => handleAlbumClick(album)}
        >
          <div className="album-image-container">
            <img 
              src={album.imageUrl || 'https://via.placeholder.com/300'} 
              alt={album.albumName} 
              className="album-image"
            />
          </div>
          <div className="album-info">
            <h3 className="album-title">{album.albumName}</h3>
            <p className="album-artist">{album.artistId?.name || 'Unknown Artist'}</p>
            <p className="album-tracks">{album.tracks?.length || 0} tracks</p>
          </div>
        </div>
      ))}
    </div>
  );

  // Render detailed view of a selected album with its tracks
  const renderAlbumDetail = () => {
    if (!selectedAlbum) return null;
    
    return (
      <div className="album-detail">
        <div className="album-detail-header">
          <button className="back-button" onClick={handleBackFromAlbum}>
            <ChevronLeft size={24} />
          </button>
          <div className="album-detail-info">
            <div className="album-detail-image-container">
              <img 
                src={selectedAlbum.imageUrl || 'https://via.placeholder.com/300'} 
                alt={selectedAlbum.albumName} 
                className="album-detail-image"
              />
            </div>
            <div className="album-detail-text">
              <h2 className="album-detail-title">{selectedAlbum.albumName}</h2>
              <p className="album-detail-artist">{selectedAlbum.artistId?.name || 'Unknown Artist'}</p>
              <p className="album-detail-desc">{selectedAlbum.description}</p>
              <p className="album-detail-count">
                {selectedAlbum.tracks?.length || 0} tracks • 
                {new Date(selectedAlbum.createdAt).getFullYear()}
              </p>
            </div>
          </div>
        </div>

        <div className="album-tracks-list">
          <h3 className="tracks-title">Tracks</h3>
          {selectedAlbum.tracks && selectedAlbum.tracks.length > 0 ? (
            <div className="tracks-container">
              {selectedAlbum.tracks.map((track, index) => (
                <div 
                  key={track._id || index} 
                  className={`track-item ${currentTrack && currentTrack._id === track._id ? 'active' : ''}`}
                  onClick={() => handleTrackClick(track)}
                >
                  <div className="track-number">{index + 1}</div>
                  <div className="track-image">
                    <img 
                      src={selectedAlbum.imageUrl || 'https://via.placeholder.com/80'} 
                      alt={track.trackName} 
                    />
                    <div className="play-indicator">
                      {isTrackPlaying(track) ? <Pause size={20} /> : <Play size={20} />}
                    </div>
                  </div>
                  <div className="track-info">
                    <h4 className="track-name">{track.trackName}</h4>
                    <p className="track-duration">{track.duration || '0:00'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-tracks-message">No tracks available in this album</p>
          )}
        </div>
      </div>
    );
  };

  // Render the albums view with loading and error states
  const renderAlbumsView = () => {
    // Show loading state
    if (albumsLoading) {
      return <div className="loading-state">Loading albums...</div>;
    }

    // Show error state
    if (albumsError) {
      return <div className="error-state">{albumsError}</div>;
    }

    // Render either album grid or album detail based on selection
    return (
      <div className="albums-view">
        <h2 className="section-title">Albums</h2>
        {selectedAlbum ? renderAlbumDetail() : renderAlbumsGrid()}
      </div>
    );
  };

  const renderContent = () => {
    if (selectedArtist) return null;

    switch (activeView) {
      case 'discover':
        return renderDiscoverView();
      case 'tracks':
        return renderTracksView();
      case 'albums':
        return renderAlbumsView();
      case 'artists':
        return <ArtistsView onTrackClick={handleTrackClick}/>;
      default:
        return renderDiscoverView();
    }
  };

  // Main component render
  return (
    <div className="music-browser">
      <header className="header">
        <div className="header-top">
          <div className="logo">Vibey</div>
          <button
            className="upload-button"
            onClick={() => navigate('/upload')}
          >
            Upload
          </button>
        </div>
        <nav className="nav">
          <ul>
            <li
              className={activeView === 'discover' ? 'active' : ''}
              onClick={() => setActiveView('discover')}
            >
              Discover
            </li>
            <li
              className={activeView === 'tracks' ? 'active' : ''}
              onClick={() => setActiveView('tracks')}
            >
              Tracks
            </li>
            <li
              className={activeView === 'albums' ? 'active' : ''}
              onClick={() => setActiveView('albums')}
            >
              Albums
            </li>
            <li
              className={activeView === 'artists' ? 'active' : ''}
              onClick={() => setActiveView('artists')}
            >
              Artists
            </li>
          </ul>
        </nav>
      </header>

      <main className="main-content">{renderContent()}</main>

      <footer className={`player-bar ${currentTrack ? 'visible' : 'hidden'}`}>
        <div className="player-container">
          {currentTrack && (
            <>
              <div className="player-track-info">
                <div className="player-track-image">
                  <img src={currentTrack.imageUrl || 'https://via.placeholder.com/200'} alt={currentTrack.trackName} />
                </div>
                <div className="player-track-details">
                  <h4>{currentTrack.trackName}</h4>
                  <p>{currentTrack.artistName || currentTrack.artistId?.name || 'Unknown Artist'}</p>
                </div>
              </div>
              <div className="player-controls">
                <div className="control-buttons">
                  <button 
                    className={`control-button ${isShuffling ? 'active' : ''}`}
                    onClick={toggleShuffle}
                  >
                    <Shuffle size={20} />
                  </button>
                  <button 
                    className="control-button"
                    onClick={playPrevious}
                  >
                    <SkipBack size={24} />
                  </button>
                  <button 
                    className="play-pause-button"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  <button 
                    className="control-button"
                    onClick={playNext}
                  >
                    <SkipForward size={24} />
                  </button>
                  <button 
                    className={`control-button ${isRepeating ? 'active' : ''}`}
                    onClick={toggleRepeat}
                  >
                    <Repeat size={20} />
                  </button>
                </div>
                <div className="audio-controls">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="progress-bar"
                  />
                  <div className="time-display">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>
              <div className="volume-controls">
                <button 
                  className="control-button"
                  onClick={toggleMute}
                >
                  {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="volume-slider"
                />
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
};

export default Listener;