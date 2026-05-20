import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Story } from '../types/social';
import { colors } from '../theme/colors';

type Props = {
  story: Story;
};

export default function StoryBubble({ story }: Props) {
  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.ring,
          {
            borderColor: story.hasNewStory ? story.avatarColor : colors.border
          }
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: story.avatarColor }]}>
          <Text style={styles.avatarText}>{story.name[0]}</Text>
        </View>

        {story.isLive && (
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>

      <Text numberOfLines={1} style={styles.name}>
        {story.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 80,
    alignItems: 'center',
    marginRight: 12
  },
  ring: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '900'
  },
  liveBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8
  },
  liveText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '900'
  },
  name: {
    color: colors.text,
    fontSize: 12,
    marginTop: 8,
    maxWidth: 72,
    fontWeight: '700'
  }
});
