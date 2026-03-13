import React from 'react';
import { View, StyleSheet, TextInput, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getSearchText, setSearchText, subscribeToSearch } from '../utils/searchStore';

export default function CustomExploreHeader() {
  const [searchTextLocal, setSearchTextLocal] = React.useState(getSearchText());

  React.useEffect(() => {
    const unsubscribe = subscribeToSearch(setSearchTextLocal);
    return () => unsubscribe();
  }, []);

  const handleSearchChange = (text) => {
    setSearchText(text);        // 🔁 update global state
    setSearchTextLocal(text);  // 🧠 update local input
  };

  return (
    <View style={styles.headerContainerDynamic}>
      <View style={[
        styles.searchBarCustom,
        {
          left: "7%",
          ...Platform.select({ ios: { left: "-7%" } }),
        },
      ]}>
        <TextInput
          style={styles.searchInputCustom}
          placeholder="Search..."
          placeholderTextColor="#999"
          value={searchTextLocal}
          onChangeText={handleSearchChange}
        />
        <Ionicons
          name="search-outline"
          size={20}
          color="#2E7D32"
          left={20}
          style={{ ...Platform.select({ ios: { left: '39%' } }) }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainerDynamic: {
    backgroundColor: 'transparent',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingBottom: 10,
    alignItems: 'center',
  },
  searchBarCustom: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 5,
    height: 45,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        height: 35,
        bottom: 4,
        width: '120%',
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchInputCustom: {
    fontSize: 16,
    color: '#333',
    paddingRight: 10,
    ...Platform.select({
      android: {
        width: '81%',
        left: 10,
        right: 0,
      },
      ios: {
        width: '70%',
        left: 10,
        right: 0,
      },
    }),
  },
});
