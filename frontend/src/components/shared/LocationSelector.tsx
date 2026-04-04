import React, { useState, useMemo } from 'react';
import { COUNTRIES, getStatesForCountry } from '../../data/constants';

interface LocationSelectorProps {
  country: string;
  city: string;
  onCountryChange: (country: string) => void;
  onCityChange: (city: string) => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  country,
  city,
  onCountryChange,
  onCityChange,
}) => {
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [isOtherCity, setIsOtherCity] = useState(false);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES;
    const lower = countrySearch.toLowerCase();
    return COUNTRIES.filter((c) => c.toLowerCase().includes(lower));
  }, [countrySearch]);

  const cities = useMemo(() => getStatesForCountry(country), [country]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return cities;
    const lower = citySearch.toLowerCase();
    return cities.filter((c) => c.toLowerCase().includes(lower));
  }, [cities, citySearch]);

  const handleCountrySelect = (selected: string) => {
    onCountryChange(selected);
    onCityChange('');
    setCountrySearch('');
    setShowCountryDropdown(false);
    setIsOtherCity(false);
    setCitySearch('');
  };

  const handleCitySelect = (selected: string) => {
    if (selected === '__other__') {
      setIsOtherCity(true);
      onCityChange('');
    } else {
      setIsOtherCity(false);
      onCityChange(selected);
    }
    setCitySearch('');
    setShowCityDropdown(false);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.fieldGroup}>
        <label style={styles.label}>Country</label>
        <div style={styles.dropdownContainer}>
          <input
            type="text"
            style={styles.input}
            placeholder="Select a country..."
            value={showCountryDropdown ? countrySearch : country}
            onChange={(e) => {
              setCountrySearch(e.target.value);
              if (!showCountryDropdown) setShowCountryDropdown(true);
            }}
            onFocus={() => {
              setShowCountryDropdown(true);
              setCountrySearch('');
            }}
            onBlur={() => {
              // Delay to allow click on dropdown item
              setTimeout(() => setShowCountryDropdown(false), 200);
            }}
          />
          {showCountryDropdown && (
            <div style={styles.dropdown}>
              {filteredCountries.length === 0 ? (
                <div style={styles.noResults}>No countries found</div>
              ) : (
                filteredCountries.map((c) => (
                  <div
                    key={c}
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor: c === country ? '#e9ecef' : undefined,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCountrySelect(c);
                    }}
                  >
                    {c}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>State / Province</label>
        {isOtherCity ? (
          <div style={styles.otherRow}>
            <input
              type="text"
              style={styles.input}
              placeholder="Type your state/province..."
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
            />
            <button
              type="button"
              style={styles.backToListBtn}
              onClick={() => {
                setIsOtherCity(false);
                onCityChange('');
              }}
            >
              Back to list
            </button>
          </div>
        ) : (
          <div style={styles.dropdownContainer}>
            <input
              type="text"
              style={styles.input}
              placeholder={country ? 'Select a state/province...' : 'Select a country first'}
              value={showCityDropdown ? citySearch : city}
              disabled={!country}
              onChange={(e) => {
                setCitySearch(e.target.value);
                if (!showCityDropdown) setShowCityDropdown(true);
              }}
              onFocus={() => {
                setShowCityDropdown(true);
                setCitySearch('');
              }}
              onBlur={() => {
                setTimeout(() => setShowCityDropdown(false), 200);
              }}
            />
            {showCityDropdown && country && (
              <div style={styles.dropdown}>
                {filteredCities.map((c) => (
                  <div
                    key={c}
                    style={{
                      ...styles.dropdownItem,
                      backgroundColor: c === city ? '#e9ecef' : undefined,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCitySelect(c);
                    }}
                  >
                    {c}
                  </div>
                ))}
                <div
                  style={{ ...styles.dropdownItem, color: '#007bff', fontStyle: 'italic' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCitySelect('__other__');
                  }}
                >
                  Other (type manually)
                </div>
                {filteredCities.length === 0 && (
                  <div style={styles.noResults}>No states match your search</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '200px',
    overflowY: 'auto',
    backgroundColor: 'white',
    border: '1px solid #ddd',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    zIndex: 100,
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
  dropdownItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  noResults: {
    padding: '8px 12px',
    color: '#999',
    fontSize: '13px',
  },
  otherRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  backToListBtn: {
    padding: '8px 12px',
    backgroundColor: '#e9ecef',
    color: '#495057',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    whiteSpace: 'nowrap' as const,
  },
};
