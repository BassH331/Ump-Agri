import React, { useState } from 'react';
import { ScrollView, ActivityIndicator, View, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BuildingCard from '../../components/BuildingCard'; // Adjust if needed
import useBuildings from '../../hooks/useBuildings';

export default function ResidenceScreen() {
  const [expandedCardId, setExpandedCardId] = useState(null);
  const { buildings, loading } = useBuildings();

  const navigation = useNavigation();

  // Filter based on keywords in the name
  const foodBuildings = buildings.filter((b) => {
    const name = b.name?.toLowerCase() || '';

    // Include specific residence blocks A/C/D/E/F even if 'res' not present
    const blockLetters = ['a', 'c', 'd', 'e', 'f'];
    const hasLetterBlock = blockLetters.some(letter =>
      name.includes(`block ${letter}`) ||
      name.includes(`res block ${letter}`) ||
      name.includes(`residence block ${letter}`) ||
      name.includes(`block ${letter} res`) ||
      name.includes(`block ${letter} residence`)
    );

    // Re-add Building 7 Female Residence matching
    const hasBuilding7Female = (
      /\b(building\s*7|block\s*7|b7)\b/.test(name) &&
      (name.includes('female') || name.includes('ladies') || name.includes('girls'))
    );

    const isResidence = (
      hasLetterBlock ||
      hasBuilding7Female ||
      name.includes('residence') ||
      name.includes('residences') ||
      name.includes('res ') ||
      name.includes('rooms') ||
      name.includes('letaba') ||
      name.includes('loskop') ||
      name.includes('de kaap') ||
      name.includes('female') ||
      name.includes('13')
    );

    const isExcluded = (
      name.includes('administration') ||
      name.includes('admin') ||
      name.includes('teaching') ||
      name.includes('multi-purpose')
    );

    return isResidence && !isExcluded;
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
          No residences buildings found.
        </Text>
      )}
    </ScrollView>
  );
}
