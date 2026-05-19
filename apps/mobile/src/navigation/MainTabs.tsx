import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeFeedScreen from '../screens/HomeFeedScreen';
import ExploreScreen from '../screens/ExploreScreen';
import UploadPostScreen from '../screens/UploadPostScreen';
import ReelsScreen from '../screens/ReelsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeFeedScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Upload" component={UploadPostScreen} />
      <Tab.Screen name="Reels" component={ReelsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
