import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fetchBuildingImages } from './imageLinks'; // Adjust path as needed
import GlowView from './GlowView';

export default function BuildingCard({ item, isExpanded, onToggleExpand, onNavigate }) {
  const navigation = useNavigation();
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    const loadImage = async () => {
      console.log(`🔍 Fetching image for: ${item.name}`);
      try {
        const result = await fetchBuildingImages(item.name);
        console.log(`📦 API result for "${item.name}":`, result);

        if (result && result.imageurl) {
          console.log(`✅ Found image for "${item.name}": ${result.imageurl}`);
          setImageUrl(result.imageurl);
        } else {
          console.warn(`⚠️ No image found for "${item.name}". Using fallback.`);
        }
      } catch (err) {
        console.error(`❌ Failed to fetch image for "${item.name}":`, err.message);
      }
    };

    // Only load image if item.name exists
    if (item?.name) {
      loadImage();
    }
  }, [item.name]);


  const fallbackImage = require('../Campus_img/Cafeteria_old_lib.jpg'); // Local fallback

  return (
    <GlowView borderRadius={16}>
      <View key={item.id} style={styles.card}>
        <Image
          source={
            imageUrl
              ? { uri: imageUrl }
              : item.imageurl
                ? { uri: item.imageurl }
                : fallbackImage
          }
          style={styles.image}
        />


        <View style={styles.cardContent}>
          <Text style={styles.buildingName}>{item.name}</Text>
          <Text style={styles.buildingType}>{item.type || 'Campus Building'}</Text>
          <Text style={styles.buildingDistance}>{typeof item.distance === 'string' ? item.distance : '200m away'}</Text>

          {isExpanded && (
            <View style={styles.expandedContent}>
              <Text style={styles.detailText}>{item.description || 'No description available'}</Text>
              <Text style={styles.detailText}>Open Hours: {typeof item.hours === 'string' ? item.hours : '8:00 AM - 5:00 PM'}</Text>
              {(() => {
                const contactText = typeof item?.contact === 'string' 
                  ? item.contact 
                  : (item?.contact && typeof item.contact === 'object' 
                    ? (item.contact.phone || item.contact.email || null) 
                    : null);
                return contactText ? (
                  <Text style={styles.detailText}>Contact: {contactText}</Text>
                ) : null;
              })()}
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.viewButton} onPress={onToggleExpand}>
              <Text style={styles.viewButtonText}>
                {isExpanded ? 'Hide' : 'View'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navigateButton} onPress={onNavigate}>
              <Text style={styles.navigateButtonText}>Navigate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </GlowView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  buildingName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 4,
  },
  buildingType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  buildingDistance: {
    fontSize: 13,
    color: '#1E90FF',
    marginBottom: 10,
  },
  expandedContent: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
  },
  detailText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  viewButton: {
    backgroundColor: '#E6F0FA',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  viewButtonText: {
    color: '#1E90FF',
    fontWeight: '600',
  },
  navigateButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  navigateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});