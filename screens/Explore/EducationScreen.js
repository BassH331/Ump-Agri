import React, { useState } from 'react';
import { ScrollView, ActivityIndicator, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BuildingCard from '../../components/BuildingCard'; // Adjust if needed
import useBuildings from '../../hooks/useBuildings';

export default function EducationScreen() {
  const [expandedCardId, setExpandedCardId] = useState(null);
  const { buildings, loading } = useBuildings();

  const navigation = useNavigation();

 
  const foodBuildings = (() => {
    const matches = buildings.filter((b) => {
      const name = b.name?.toLowerCase() || '';
      return (
        name.includes('education') ||
        name.includes('lecture') ||
        name.includes('hall') ||
        name.includes('4') ||
        name.includes('study') ||
        name.includes('auditorium')||
        name.includes('ive') ||
        name.includes('new')||
        name.includes('hospitality building')||
        name.includes('multi')
      ) && !/\bdining\s+hall\b/i.test(name);
    });
    const normalizeName = (s) => s?.trim().toLowerCase().replace(/\s+/g, ' ');
    const seen = new Set();
    return matches.filter((b) => {
      const key = normalizeName(b.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

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
      {foodBuildings.length > 0 ? (
        foodBuildings.map((item) => (
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
          No education buildings found.
        </Text>
      )}
    </ScrollView>
  );
}
