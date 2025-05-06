import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './listener.css';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Repeat,
  Shuffle
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

  const navigate = useNavigate();
  const audioRef = useRef(new Audio());

  // Helper function for creating unique track identifiers
  const getTrackIdentifier = (track) => {
    // Use a combination of trackName and artistName as a unique identifier
    return `${track.trackName}-${track.artistName}-${track.createdAt || index}`;
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

  // Core track playback handler
  // const handleTrackClick = (track) => {
  //   // First check if we're dealing with the same track using our helper function
  //   if (currentTrack && getTrackIdentifier(currentTrack) === getTrackIdentifier(track)) {
  //     // For the same track, just toggle play state
  //     setIsPlaying(!isPlaying);
  //     return;
  //   }
    
  //   // For a different track
  //   // 1. Pause the current audio and reset it
  //   const audio = audioRef.current;
  //   audio.pause();
  //   audio.currentTime = 0;
    
  //   // 2. Directly update the audio source without waiting for React state
  //   audio.src = track.audioUrl;
  //   audio.load();
    
  //   // 3. Update the state with the new track
  //   setCurrentTrack({...track}); // Use spread operator to ensure we get a new object reference
    
  //   // 4. Force play directly after a short delay to make sure the source is loaded
  //   setTimeout(() => {
  //     audio.play()
  //       .then(() => {
  //         setIsPlaying(true);
  //         // console.log("Successfully playing new track:", track.trackName);
  //       })
  //       .catch(error => {
  //         console.error("Error playing new track:", error);
  //         setIsPlaying(false);
  //       });
  //   }, 100);
  // };

  // Helper function to check if two tracks are the sam
  const isSameTrack = (track1, track2) => {
    return track1 && track2 && 
      track1.trackName === track2.trackName && 
      track1.artistName === track2.artistName;
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

      //4. Update tracl state first
      setCurrentTrack({...track});

      //5. Only then Update the audio source
      audio.src = track.audioUrl;

      //6. Set up a proper load and play sequence with proper error handling
      const playWhenReady = () => {
        // Remove the event listener to prevent multiple triggers
        audio.removeEventListener('canplaythrough', playWhenReady);

        // Set playing state to true and then play
        setIsPlaying(true);


      // Small delay to ensure React Stae is updated
      setTimeout(() => {
        const playPromise = audio.play();

        // Handle the play promise properly
        if (playPromise !== undefined) {
          playPromise
          .then(() => {
            console.log("Successfully playing new track:", track.trackName)
          })
          .catch(error => {
            console.error("Error playing new track:", error);
            //Only update state if thie still the current track
            if (isSameTrack(currentTrack, track)){
              setIsPlaying(false);
            }
          })
        }
      }, 50)
      }
      // Set up event listener for when audio can play
      audio.addEventListener('canplaythrough', playWhenReady);
      // Force load to trigger the canplaythrough event
      audio.load();

    }, 50)// Short delay to ensure pause completes
  };

  
  // Force load 

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

  // Initialize audio and fetch tracks
  useEffect(() => {
    fetchTracks();
    return () => {
      audioRef.current.pause();
      audioRef.current.src = '';
    };
  }, []);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

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
                <p className="track-artist">{track.artistName}</p>
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
            key={getTrackIdentifier(track)}
            className={`track-item ${currentTrack && getTrackIdentifier(currentTrack) === getTrackIdentifier(track) ? 'active' : ''}`}
            onClick={() => handleTrackClick(track)}
          >
            <div className="track-index">{index + 1}</div>
            <div className="track-image">
              <img src={track.imageUrl || 'https://via.placeholder.com/200'} alt={track.trackName} />
            </div>
            <div className="track-info">
              <h3 className="track-title">{track.trackName}</h3>
              <p className="track-artist">{track.artistName}</p>
            </div>
            <div className="track-duration">{new Date(track.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (selectedArtist) return null;

    switch (activeView) {
      case 'discover':
        return renderDiscoverView();
      case 'tracks':
        return renderTracksView();
      case 'albums':
        return <div className="albums-view">Albums view will be implemented here.</div>;
      case 'artists':
        return <div className="artists-view">Artists view will be implemented here.</div>;
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
                  <p>{currentTrack.artistName}</p>
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