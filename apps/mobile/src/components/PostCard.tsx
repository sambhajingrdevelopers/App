import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Post } from '../types/social';
import { colors } from '../theme/colors';
import { screen } from '../utils/responsive';

type Props = {
  post: Post;
  onOpen?: () => void;
};

export default function PostCard({ post, onOpen }: Props) {
  const mediaHeight = screen.isLarge ? 420 : 330;

  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: post.color }]}>
          <Text style={styles.avatarText}>{post.name[0]}</Text>
        </View>

        <View style={styles.userBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>@{post.user}</Text>
            {post.verified && <Text style={styles.verified}>✓</Text>}
          </View>

          <Text style={styles.location}>
            {post.location} • {post.createdAt || 'Now'}
          </Text>
        </View>

        <Text style={styles.menu}>•••</Text>
      </View>

      <View style={[styles.media, { height: mediaHeight, backgroundColor: post.color }]}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.mediaCenter}>
          <Text style={styles.mediaTitle}>VibeLoop</Text>
          <Text style={styles.mediaSubtitle}>Premium Social Post</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Text style={styles.action}>♡</Text>
        <Text style={styles.action}>💬</Text>
        <Text style={styles.action}>↗</Text>

        <View style={styles.actionSpacer} />

        <Text style={styles.action}>🔖</Text>
      </View>

      <View style={styles.metricsRow}>
        <Text style={styles.metric}>{post.likes} likes</Text>
        <Text style={styles.metricMuted}>{post.shares || '0'} shares</Text>
        <Text style={styles.metricMuted}>{post.saves || '0'} saves</Text>
      </View>

      <Text style={styles.caption}>
        <Text style={styles.username}>@{post.user} </Text>
        {post.caption}
      </Text>

      <Text style={styles.comments}>View all {post.comments} comments</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 30,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11
  },
  avatarText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 18
  },
  userBlock: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  username: {
    color: colors.text,
    fontWeight: '900'
  },
  verified: {
    color: colors.accent,
    fontWeight: '900'
  },
  location: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3
  },
  menu: {
    color: colors.text,
    fontSize: 18,
    letterSpacing: 2
  },
  media: {
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  glowTop: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.20)',
    top: 20,
    left: 20
  },
  glowBottom: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0,0,0,0.20)',
    bottom: -60,
    right: -60
  },
  mediaCenter: {
    alignItems: 'center'
  },
  mediaTitle: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1
  },
  mediaSubtitle: {
    color: colors.white,
    opacity: 0.88,
    fontWeight: '800',
    marginTop: 6
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 17
  },
  action: {
    color: colors.text,
    fontSize: 24
  },
  actionSpacer: {
    flex: 1
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 7
  },
  metric: {
    color: colors.text,
    fontWeight: '900'
  },
  metricMuted: {
    color: colors.muted,
    fontWeight: '700'
  },
  caption: {
    color: colors.text,
    lineHeight: 22
  },
  comments: {
    color: colors.muted,
    marginTop: 9,
    fontWeight: '700'
  }
});
