import React, { createContext, useContext, useState } from 'react';

// Create a context for search functionality
const SearchContext = createContext();

// Provider component to share search state
export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>
      {children}
    </SearchContext.Provider>
  );
};

// Hook to use search context
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};