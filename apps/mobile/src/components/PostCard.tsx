import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function PostCard({ post, onOpen }: any) {
  return (
    <Pressable style={styles.card} onPress={onOpen}>
      <View style={styles.top}>
        <View style={[styles.avatar, { backgroundColor: post.color }]}>
          <Text style={styles.avatarText}>{post.name[0]}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.username}>@{post.user}</Text>
          <Text style={styles.location}>{post.location}</Text>
        </View>

        <Text style={styles.menu}>•••</Text>
      </View>

      <View style={[styles.media, { backgroundColor: post.color }]}>
        <View style={styles.glow1} />
        <View style={styles.glow2} />
        <Text style={styles.mediaText}>VibeLoop Post</Text>
      </View>

      <View style={styles.actions}>
        <Text style={styles.action}>♡</Text>
        <Text style={styles.action}>💬</Text>
        <Text style={styles.action}>↗</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.action}>🔖</Text>
      </View>

      <Text style={styles.likes}>{post.likes} likes</Text>

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
    borderRadius: 28,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  avatarText: {
    color: colors.white,
    fontWeight: '900',
    fontSize: 18
  },
  username: {
    color: colors.text,
    fontWeight: '800'
  },
  location: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  menu: {
    color: colors.text,
    fontSize: 18
  },
  media: {
    height: 330,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  glow1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.18)',
    top: 20,
    left: 20
  },
  glow2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0,0,0,0.18)',
    bottom: -40,
    right: -40
  },
  mediaText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900'
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16
  },
  action: {
    color: colors.text,
    fontSize: 24
  },
  likes: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: 6
  },
  caption: {
    color: colors.text,
    lineHeight: 21
  },
  comments: {
    color: colors.muted,
    marginTop: 8
  }
});
