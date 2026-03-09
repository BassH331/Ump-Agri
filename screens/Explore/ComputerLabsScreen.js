import React, { useState } from 'react';
import { ScrollView, ActivityIndicator, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BuildingCard from '../../components/BuildingCard'; // Adjust if needed
import useBuildings from '../../hooks/useBuildings';

export default function ComputerLabsScreen() {
  const [expandedCardId, setExpandedCardId] = useState(null);
  const { buildings, loading } = useBuildings();

  const navigation = useNavigation();

  // Filter based on keywords in the name
  const computerLabBuildings = buildings.filter((b) => {
    const name = b.name?.toLowerCase() || '';
    return (
      name.includes('computer') ||
     // name.includes('lab') ||
     // name.includes('ict') ||
      name.includes('technology')
    );
  });


  const handleNavigate = (building) => {
    navigation.navigate('Directions', {
      destination: {
        name: building.name,
        latitude: building.latitude,
        longitude: building.longitude,
        ...building,
      },
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
        <ActivityIndicator size="large" color="#f3682b" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 20 }}>
      {computerLabBuildings.length > 0 ? (
        computerLabBuildings.map((item) => (
          <BuildingCard
            key={item._id}
            item={item}
            isExpanded={expandedCardId === item._id}
            onToggleExpand={() =>
              setExpandedCardId(expandedCardId === item._id ? null : item._id)
            }
            onNavigate={() => handleNavigate(item)}
          />
        ))
      ) : (
        <Text style={{ textAlign: 'center', marginTop: 30, color: '#666' }}>
          No computer lab buildings found.
        </Text>
      )}
    </ScrollView>
  );
}
