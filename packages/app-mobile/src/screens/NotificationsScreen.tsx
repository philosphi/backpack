import type {
  EnrichedNotification,
  GroupedNotification,
} from "@coral-xyz/common";

import { Suspense, useCallback } from "react";
import { Text, SectionList, ActivityIndicator } from "react-native";

import { NotificationsData } from "@coral-xyz/recoil";
import { Separator, useUserMetadata } from "@coral-xyz/tamagui";
import { ErrorBoundary } from "react-error-boundary";

import {
  SectionHeader,
  SectionSeparator,
  ListItemNotification,
  ListItemFriendRequest,
} from "~components/ListItem";
import { Screen, RoundedContainerGroup } from "~components/index";

function parseJson(body: string) {
  try {
    return JSON.parse(body);
  } catch (_ex) {
    return {};
  }
}

const getTimeStr = (timestamp: number) => {
  const elapsedTimeSeconds = (new Date().getTime() - timestamp) / 1000;
  if (elapsedTimeSeconds < 60) {
    return "now";
  }
  if (elapsedTimeSeconds / 60 < 60) {
    const min = Math.floor(elapsedTimeSeconds / 60);
    if (min === 1) {
      return "1 min";
    } else {
      return `${min} mins`;
    }
  }

  if (elapsedTimeSeconds / 3600 < 24) {
    const hours = Math.floor(elapsedTimeSeconds / 3600);
    if (hours === 1) {
      return "1 hour";
    } else {
      return `${hours} hours`;
    }
  }
  const days = Math.floor(elapsedTimeSeconds / 3600 / 24);
  if (days === 1) {
    return `1 day`;
  }
  return `${days} days`;
};

const FriendRequestListItem = ({ notification, title }) => {
  const user = useUserMetadata({
    remoteUserId: parseJson(notification.body).from,
  });

  if (user.username === "" && user.loading === false) {
    return null;
  }

  return (
    <ListItemFriendRequest
      grouped
      text={notification.title}
      username={`@${user.username}`}
      time={getTimeStr(notification.timestamp)}
      avatarUrl={user.image}
    />
  );
};

const ListItem = ({ item }: { item: EnrichedNotification }) => {
  if (item.xnft_id === "friend_requests") {
    return <FriendRequestListItem title="Friend request" notification={item} />;
  }

  if (item.xnft_id === "friend_requests_accept") {
    return (
      <FriendRequestListItem
        title="Friend request accepted"
        notification={item}
      />
    );
  }

  return (
    <ListItemNotification
      grouped
      unread
      title={item.xnftTitle}
      body={item.body}
      time={getTimeStr(item.timestamp)}
      iconUrl={item.xnftImage}
    />
  );
};

export function NotificationList({
  groupedNotifications,
}: {
  groupedNotifications: GroupedNotification[];
}) {
  const sections = groupedNotifications.map((groupedNotification) => ({
    title: groupedNotification.date,
    data: groupedNotification.notifications,
  }));

  const keyExtractor = (item, index) => item.id.toString() + index.toString();
  const renderItem = useCallback(({ item, section, index }: any) => {
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;
    return (
      <RoundedContainerGroup
        disableTopRadius={!isFirst}
        disableBottomRadius={!isLast}
      >
        <ListItem item={item} />
      </RoundedContainerGroup>
    );
  }, []);

  const renderSectionHeader = useCallback(({ section }: any) => {
    return <SectionHeader title={section.title} />;
  }, []);

  return (
    <SectionList
      sections={sections}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      ItemSeparatorComponent={Separator}
      SectionSeparatorComponent={SectionSeparator}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  );
}

function Container(): JSX.Element {
  return (
    <Screen>
      <NotificationsData>
        {({
          groupedNotifications,
        }: {
          groupedNotifications: GroupedNotification[];
        }) => {
          return (
            <NotificationList groupedNotifications={groupedNotifications} />
          );
        }}
      </NotificationsData>
    </Screen>
  );
}

export function NotificationsScreen(): JSX.Element {
  return (
    <ErrorBoundary fallbackRender={({ error }) => <Text>{error.message}</Text>}>
      <Suspense fallback={<ActivityIndicator size="large" />}>
        <Container />
      </Suspense>
    </ErrorBoundary>
  );
}
