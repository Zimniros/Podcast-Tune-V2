/* eslint-disable import/no-cycle */
import React, { Component } from 'react';
import { graphql, compose } from 'react-apollo';
import Link from 'next/link';
import gql from 'graphql-tag';
import dayjs from 'dayjs';
import { number, func, bool } from 'prop-types';

import Icon from '@mdi/react';
import {
  mdiRotateLeft as skipBackIcon,
  mdiRotateRight as skipAheadIcon,
  mdiPlay as playIcon,
  mdiPause as pauseIcon,
} from '@mdi/js';

import { CURRENT_USER_QUERY } from '../Sidebar/User';
import ProgressBar from './controls/progressBar';
import PlaybackRate from './controls/playbackRate';
import Volume from './controls/volume';
import Queue from './controls/queue';

// const GET_EPISODE_QUERY = gql`
//   query GET_EPISODE_QUERY($id: ID!) {
//     episode(where: { id: $id }) {
//       id
//       title
//       pubDate
//       duration
//       mediaUrl

//       podcast {
//         id
//         artworkSmall
//         author
//       }
//     }
//   }
// `;

const GET_USER_PLAYING_EPISODE = gql`
  query GET_USER_PLAYING_EPISODE {
    playingEpisode {
      id
      position

      episode {
        id
        title
        pubDate
        duration
        durationVerified
        mediaUrl
        playedTime

        podcast {
          id
          artworkSmall
          author
        }
      }
    }
  }
`;

const PLAY_MUTATION = gql`
  mutation {
    play @client
  }
`;

const PAUSE_MUTATION = gql`
  mutation {
    pause @client
  }
`;

const OPEN_PLAYER_MUTATION = gql`
  mutation {
    openPlayer @client
  }
`;

const UPDATE_TIME_MUTATION = gql`
  mutation($current: Float!, $max: Float!) {
    updateTime(current: $current, max: $max) @client
  }
`;

const UPDATE_EPISODE_DURATION_MUTATION = gql`
  mutation($id: ID!, $duration: Float!) {
    updateEpisodeDuration(id: $id, duration: $duration) {
      id
      duration
      durationVerified
    }
  }
`;

const SET_USER_PLAYED_TIME_MUTATION = gql`
  mutation($id: ID!, $playedTime: Float!) {
    setPlayedTime(id: $id, playedTime: $playedTime) {
      id
      updatedAt

      episode {
        id
        playedTime
      }
    }
  }
`;

// const PLAYING_EPISODE_ID_QUERY = gql`
//   query {
//     playingEpisodeId @client
//   }
// `;

const PLAYING_STATUS_QUERY = gql`
  query {
    isPlaying @client
  }
`;

const PLAYER_STATUS_QUERY = gql`
  query {
    isPlayerOpen @client
  }
`;

const PLAYBACK_RATE_QUERY = gql`
  query {
    playbackRate @client
  }
`;

const VOLUME_QUERY = gql`
  query {
    volume @client
  }
`;

const MUTE_STATUS_QUERY = gql`
  query {
    isMuted @client
  }
`;

class Audioplayer extends Component {
  constructor(props) {
    super(props);
    this.player = React.createRef();
  }

  componentDidMount() {
    const { playingEpisode, openPlayer } = this.props;

    if (playingEpisode) {
      openPlayer();
    }
  }

  componentDidUpdate(prevProps) {
    const {
      isPlaying,
      playingEpisode,
      openPlayer,
      playbackRate,
      volume,
      isMuted,
    } = this.props;
    const { current: player } = this.player;

    // if (!prevProps.playingEpisodeId && playingEpisodeId) {
    //   openPlayer();
    // }

    if (!prevProps.playingEpisode && playingEpisode) {
      openPlayer();
    }

    if (player && player.playbackRate !== playbackRate) {
      player.playbackRate = playbackRate;
    }

    if (player && player.volume !== volume) {
      player.volume = volume;
    }

    if (player && player.muted !== isMuted) {
      player.muted = isMuted;
    }

    if (isPlaying && player) {
      this.handlePlay();
    } else if (!isPlaying && player && player.src) {
      this.handlePause();
    }
  }

  handlePlay = () => {
    if (this.player.current.paused) {
      clearInterval(this.playInterval);
      const playPromise = this.player.current.play();
      playPromise.then(() => {
        this.createTimeInterval();
      });
    }
  };

  handlePause = () => {
    if (!this.player.current.paused) {
      this.player.current.pause();
      clearInterval(this.playInterval);
    }
  };

  onCanPlay = () => {
    const { isPlaying } = this.props;
    if (isPlaying) {
      this.handlePlay();
    }
  };

  verifyDuration = () => {
    const { playingEpisode, verifyDuration } = this.props;
    const { episode } = playingEpisode;
    const { id, durationVerified } = episode;

    if (!durationVerified) {
      const { duration } = this.player.current;

      verifyDuration({
        variables: {
          id,
          duration,
        },
      });
    }
  };

  setTime = value => {
    clearInterval(this.playInterval);
    this.player.current.currentTime = value;

    this.updateTime();
    this.createTimeInterval();
  };

  skipTime = amount => {
    if (this.player.current) {
      const newTime = this.player.current.currentTime + amount;
      this.setTime(newTime);
    }
  };

  onEnded = () => {
    console.log('On ended');
  };

  onLoadedMetadata = () => {
    this.verifyDuration();
  };

  updateTime = () => {
    const { updateTime, setPlayedTime, playingEpisode } = this.props;

    if (!playingEpisode) {
      clearInterval(this.playInterval);
      return;
    }

    const { episode } = playingEpisode;
    const { id } = episode;

    if (this.player.current) {
      updateTime({
        variables: {
          current: this.player.current.currentTime,
          max: this.player.current.duration,
        },
      });

      setPlayedTime({
        variables: {
          id,
          playedTime: this.player.current.currentTime,
        },
      });
    }
  };

  onDurationChange = () => {
    const { updateTime, playingEpisode } = this.props;
    const { episode } = playingEpisode;
    const { playedTime } = episode;
    this.player.current.currentTime = playedTime || 0;
    updateTime({
      variables: {
        current: playedTime || 0,
        max: this.player.current.duration,
      },
    });
  };

  createTimeInterval() {
    this.playInterval = setInterval(() => this.updateTime(), 1000);
  }

  render() {
    const { isPlaying, isPlayerOpen, play, pause, playingEpisode } = this.props;

    if (!isPlayerOpen) return null;

    const episode = playingEpisode ? playingEpisode.episode : null;

    return (
      <div className="player">
        <div className="player__controls-left">
          {episode && (
            <Link
              href={{
                pathname: '/podcast',
                query: { id: episode.podcast.id },
              }}
            >
              <a className="player__artwork-wrapper">
                <img
                  src={episode.podcast.artworkSmall}
                  alt="Podcast artwork."
                  className="player__artwork"
                />
              </a>
            </Link>
          )}

          <button
            onClick={() => this.skipTime(-15)}
            type="button"
            className="controls__skip-button"
          >
            <Icon path={skipBackIcon} className="controls__icon" />
          </button>

          <button
            type="button"
            className="controls__play-button"
            onClick={isPlaying ? pause : play}
          >
            <Icon
              path={isPlaying ? pauseIcon : playIcon}
              className="controls__icon"
            />
          </button>

          <button
            onClick={() => this.skipTime(30)}
            type="button"
            className="controls__skip-button"
          >
            <Icon path={skipAheadIcon} className="controls__icon" />
          </button>
        </div>

        <div className="player__info">
          <div className="player__title-wrapper">
            {episode ? (
              <span className="player__title" title={episode.title}>
                {episode.title}
              </span>
            ) : (
              <span>Select episode to play</span>
            )}
          </div>
          <div className="player__author-wrapper">
            {episode ? (
              <span>
                <Link
                  href={{
                    pathname: '/podcast',
                    query: { id: episode.podcast.id },
                  }}
                >
                  <a>{episode.podcast.author} </a>
                </Link>{' '}
                - {dayjs(episode.pubDate).format('MMM D, YYYY')}
              </span>
            ) : (
              '-'
            )}
          </div>
          <ProgressBar />
        </div>

        <div className="player__controls-right">
          <PlaybackRate />
          <Volume />
          <Queue />
        </div>
        {episode && (
          <audio
            style={{ display: 'none' }}
            id="player"
            ref={this.player}
            src={episode ? episode.mediaUrl : null}
            onLoadedMetadata={() => this.onLoadedMetadata()}
            onCanPlay={() => this.onCanPlay()}
            onEnded={() => this.onEnded()}
            onDurationChange={() => this.onDurationChange()}
            preload="metadata"
            autoPlay={false}
          />
        )}
      </div>
    );
  }
}

Audioplayer.propTypes = {
  openPlayer: func.isRequired,
  updateTime: func.isRequired,
  play: func.isRequired,
  pause: func.isRequired,
  isPlaying: bool.isRequired,
  isMuted: bool.isRequired,
  isPlayerOpen: bool.isRequired,
  volume: number.isRequired,
  playbackRate: number.isRequired,
};

export { GET_USER_PLAYING_EPISODE };
export default compose(
  // graphql(PLAYING_EPISODE_ID_QUERY, {
  //   props: ({ data: { playingEpisodeId } }) => ({ playingEpisodeId }),
  // }),
  // graphql(GET_EPISODE_QUERY, {
  // props: ({ data: { loading, error, episode } }) => ({
  //   loading,
  //   error,
  //   episode,
  // }),
  //   options: ({ playingEpisodeId }) => ({
  //     variables: { id: playingEpisodeId },
  //   }),
  //   ssr: false,
  //   skip: props => !props.playingEpisodeId,
  // }),
  graphql(CURRENT_USER_QUERY, {
    props: ({ data: { me } }) => ({ me }),
  }),
  graphql(GET_USER_PLAYING_EPISODE, {
    props: ({ data: { playingEpisode } }) => ({ playingEpisode }),

    skip: props => !props.me,
  }),
  graphql(PLAYING_STATUS_QUERY, {
    props: ({ data: { isPlaying } }) => ({ isPlaying }),
  }),
  graphql(PLAYER_STATUS_QUERY, {
    props: ({ data: { isPlayerOpen } }) => ({ isPlayerOpen }),
  }),
  graphql(PLAYBACK_RATE_QUERY, {
    props: ({ data: { playbackRate } }) => ({ playbackRate }),
  }),
  graphql(VOLUME_QUERY, {
    props: ({ data: { volume } }) => ({ volume }),
  }),
  graphql(MUTE_STATUS_QUERY, {
    props: ({ data: { isMuted } }) => ({ isMuted }),
  }),
  graphql(UPDATE_EPISODE_DURATION_MUTATION, { name: 'verifyDuration' }),
  graphql(OPEN_PLAYER_MUTATION, { name: 'openPlayer' }),
  graphql(UPDATE_TIME_MUTATION, { name: 'updateTime' }),
  graphql(SET_USER_PLAYED_TIME_MUTATION, { name: 'setPlayedTime' }),

  graphql(PLAY_MUTATION, { name: 'play' }),

  graphql(PAUSE_MUTATION, { name: 'pause' })
)(Audioplayer);
