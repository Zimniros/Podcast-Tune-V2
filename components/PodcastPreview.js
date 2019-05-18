import React, { Component } from 'react';
import Link from 'next/link';

import { previewType } from '../types';

class PodcastPreview extends Component {
  static propTypes = {
    preview: previewType.isRequired,
  };

  render() {
    const { preview } = this.props;
    const { id, title, author, description, artworkLarge } = preview;
    return (
      <Link
        href={{
          pathname: '/podcast',
          query: { id },
        }}
      >
        <a className="preview">
          <div className="preview__image-wrapper">
            <img
              src={artworkLarge}
              alt={`${title} podcast artwork.`}
              className="preview__image"
            />
          </div>
          <div className="preview__info">
            <h2 className="preview__title">{title}</h2>
            <p className="preview__description">{description}</p>
          </div>
        </a>
      </Link>
    );
  }
}

export default PodcastPreview;