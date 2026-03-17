// BusinessPage.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { getBusinessPageFavorites } from '../services/api';

// Extracted helper function for loading kashrut logo
const loadKashrutLogo = () => {
    return (<img src="/path/to/kashrut/logo.png" alt="Kashrut Logo" />);
};

class BusinessPage extends React.Component {
    state = {
        favorites: [],
        error: null,
    };

    componentDidMount() {
        this.loadFavorites();
    }

    loadFavorites = async () => {
        try {
            const response = await getBusinessPageFavorites(this.props.businessPage.id);
            if (response.error) {
                throw new Error(response.error);
            }
            this.setState({ favorites: response.data });
        } catch (error) {
            this.setState({ error: error.message });
        }
    };

    render() {
        const { favorites, error } = this.state;

        return (
            <div className="business-page">
                {error && <div className="error-message">{error}</div>}
                <header className="business-header">
                    {loadKashrutLogo()}
                    <h1>{this.props.businessPage.name}</h1>
                </header>
                <section className="favorites">
                    <h2>Favorites</h2>
                    <ul>
                        {favorites.map((favorite) => (
                            <li key={favorite.id}>{favorite.name}</li>
                        ))}
                    </ul>
                </section>
            </div>
        );
    }
}

BusinessPage.propTypes = {
    businessPage: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    }).isRequired,
};

export default BusinessPage;