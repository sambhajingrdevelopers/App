import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function StoryBubble({ story }: any) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, { borderColor: story.color }]}>
        <View style={[styles.avatar, { backgroundColor: story.color }]}>
          <Text style={styles.avatarText}>{story.name[0]}</Text>
        </View>
      </View>

      <Text numberOfLines={1} style={styles.name}>
        {story.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 78,
    alignItems: 'center',
    marginRight: 10
  },
  ring: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900'
  },
  name: {
    color: colors.text,
    fontSize: 12,
    marginTop: 6,
    maxWidth: 70
  }
});
