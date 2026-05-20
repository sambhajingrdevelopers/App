import React from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { stories, posts } from '../data/mock';
import StoryBubble from '../components/StoryBubble';
import PostCard from '../components/PostCard';

export default function HomeFeedScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>VibeLoop</Text>

          <View style={styles.headerActions}>
            <Pressable onPress={() => navigation.navigate('Notifications')}>
              <Text style={styles.icon}>♡</Text>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Messages')}>
              <Text style={styles.icon}>✉</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories}>
          {stories.map((story) => (
            <StoryBubble key={story.id} story={story} />
          ))}
        </ScrollView>

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onOpen={() => navigation.navigate('PostDetail')}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  container: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18
  },
  logo: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    flex: 1
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16
  },
  icon: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900'
  },
  stories: {
    marginBottom: 20
  }
});
