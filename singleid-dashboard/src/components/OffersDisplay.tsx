import React, { useState, useEffect } from 'react';
import singleidApi, { Location, Offer, LocationsResponse, OffersResponse } from '../services/singleidApi';
import './OffersDisplay.css';

interface OffersDisplayProps {}

interface OfferWithLocation extends Offer {
  location?: Location;
}

const OffersDisplay: React.FC<OffersDisplayProps> = () => {
  const [offers, setOffers] = useState<OfferWithLocation[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'expired' | ''>('active');

  const loadLocations = async () => {
    try {
      const response: LocationsResponse = await singleidApi.getLocations({ limit: 100 });
      setLocations(response.locations || []);
    } catch (error: any) {
      console.error('Failed to load locations:', error);
      // Don't set error state for locations as it's not critical
    }
  };

  const loadOffers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = {};
      if (selectedLocation) params.location_id = selectedLocation;
      if (selectedCategory) params.category = selectedCategory;
      if (statusFilter) params.status = statusFilter;
      params.limit = 50; // Reasonable limit

      const response: OffersResponse = await singleidApi.getOffers(params);
      
      // Enrich offers with location data if we have it
      const enrichedOffers: OfferWithLocation[] = (response.offers || []).map(offer => {
        const location = locations.find(loc => loc.id === offer.location_id);
        return { ...offer, location };
      });

      setOffers(enrichedOffers);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Failed to load offers');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDiscount = (offer: Offer): string => {
    if (offer.discount_percentage) {
      return `${offer.discount_percentage}% OFF`;
    }
    if (offer.discount_amount && offer.currency) {
      return `${offer.currency} ${offer.discount_amount} OFF`;
    }
    return 'Special Offer';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isOfferValid = (offer: Offer): boolean => {
    if (offer.status !== 'active') return false;
    if (offer.valid_until) {
      return new Date(offer.valid_until) > new Date();
    }
    return true;
  };

  const getUniqueCategories = (): string[] => {
    const categories = new Set<string>();
    offers.forEach(offer => {
      if (offer.category) categories.add(offer.category);
      if (offer.location?.category) categories.add(offer.location.category);
    });
    return Array.from(categories).sort();
  };

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    loadOffers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, selectedCategory, statusFilter, locations]);

  return (
    <div className="offers-display">
      <div className="offers-header">
        <h2>Available Offers</h2>
        <div className="offers-stats">
          <span>{offers.length} offers found</span>
          {offers.filter(isOfferValid).length < offers.length && (
            <span className="expired-count">
              ({offers.filter(isOfferValid).length} active)
            </span>
          )}
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="location-filter">Location:</label>
          <select
            id="location-filter"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map(location => (
              <option key={location.id} value={location.id}>
                {location.name} {location.city && `- ${location.city}`}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="category-filter">Category:</label>
          <select
            id="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <button onClick={loadOffers} disabled={loading} className="refresh-button">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button onClick={loadOffers} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          Loading offers...
        </div>
      )}

      {!loading && !error && offers.length === 0 && (
        <div className="no-offers">
          <p>No offers found matching your criteria.</p>
          <p>Try adjusting your filters or check if the API endpoints are configured correctly.</p>
        </div>
      )}

      <div className="offers-grid">
        {offers.map(offer => (
          <div
            key={offer.id}
            className={`offer-card ${!isOfferValid(offer) ? 'expired' : ''}`}
          >
            {offer.image_url && (
              <div className="offer-image">
                <img src={offer.image_url} alt={offer.title} />
              </div>
            )}

            <div className="offer-content">
              <div className="offer-header-card">
                <h3 className="offer-title">{offer.title}</h3>
                <div className="offer-discount">
                  {formatDiscount(offer)}
                </div>
              </div>

              <p className="offer-description">{offer.description}</p>

              {offer.location && (
                <div className="offer-location">
                  <strong>{offer.location.name}</strong>
                  {offer.location.address && (
                    <p className="location-address">{offer.location.address}</p>
                  )}
                  {offer.location.city && (
                    <span className="location-city">{offer.location.city}</span>
                  )}
                </div>
              )}

              <div className="offer-meta">
                <div className="offer-validity">
                  {offer.valid_from && (
                    <span>From: {formatDate(offer.valid_from)}</span>
                  )}
                  {offer.valid_until && (
                    <span>Until: {formatDate(offer.valid_until)}</span>
                  )}
                </div>

                <div className="offer-status-badge">
                  <span className={`status-${offer.status}`}>
                    {offer.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {offer.category && (
                <div className="offer-category">
                  Category: {offer.category}
                </div>
              )}

              {offer.terms_conditions && (
                <details className="offer-terms">
                  <summary>Terms & Conditions</summary>
                  <p>{offer.terms_conditions}</p>
                </details>
              )}

              {offer.redemption_instructions && (
                <div className="redemption-instructions">
                  <strong>How to redeem:</strong>
                  <p>{offer.redemption_instructions}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OffersDisplay;