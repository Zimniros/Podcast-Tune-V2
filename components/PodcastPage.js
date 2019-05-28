import React, { Component, Fragment } from 'react';
import Link from 'next/link';

import { string } from 'prop-types';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';

import PodcastTabs from './PodcastTabs';

function formatCategories(categories) {
  return (
    <>
      <span>A </span>
      {categories.map((el, index) => {
        const { id, name } = el;
        const last = index === categories.length - 1;
        return (
          <Fragment key={id}>
            <Link
              href={{
                pathname: '/category',
                query: { id },
              }}
            >
              <a className="podcast__category">{name}</a>
            </Link>
            <>{last ? '' : ', '}</>
          </Fragment>
        );
      })}

      <span> podcast.</span>
    </>
  );
}

const PODCAST_QUERY = gql`
  query PODCAST_QUERY($id: ID!) {
    podcast(where: { id: $id }) {
      id
      itunesId
      title
      author
      artworkLarge
      websiteUrl
      feedUrl

      categories {
        id
        name
      }
    }
  }
`;

class PodcastPage extends Component {
  static propTypes = {
    id: string.isRequired,
  };

  render() {
    const { id } = this.props;

    return (
      <div className="podcast">
        <Query
          query={PODCAST_QUERY}
          variables={{
            id,
          }}
        >
          {({ data, error, loading }) => {
            if (loading) return <p>Loading...</p>;
            if (error) return <p>Error: {error.message}</p>;

            const { podcast } = data;

            if (!podcast) {
              return <p>No Podcast with '{id}' was found.</p>;
            }

            const { title, author, artworkLarge, categories } = podcast;

            return (
              <>
                <div className="podcast__header">
                  <div className="podcast__banner">
                    <div
                      className="podcast__banner-image"
                      style={{
                        backgroundImage: `url("${artworkLarge}")`,
                      }}
                    />
                  </div>
                  <div className="podcast__card container">
                    <div className="podcast__image-wrapper">
                      <img
                        src={artworkLarge}
                        alt={`${title} podcast artwork.`}
                        className="podcast__image"
                      />
                    </div>
                    <div className="podcast__info">
                      <h2 className="podcast__title">{title}</h2>
                      <p className="podcast__author">{author}</p>
                      <p className="podcast__categories">
                        {formatCategories(categories)}
                      </p>
                    </div>
                  </div>
                </div>

                <PodcastTabs />
              </>
            );
          }}
        </Query>
      </div>
    );
  }
}

export default PodcastPage;
