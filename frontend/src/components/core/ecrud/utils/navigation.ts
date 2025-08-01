import type { BaseEntity } from "../types";

export interface NavigationInfo {
  currentIndex: number;
  totalCount: number;
  hasPrev: boolean;
  hasNext: boolean;
  currentPosition: number;
  prevTarget: NavigationTarget | null;
  nextTarget: NavigationTarget | null;
}

export interface NavigationTarget {
  page: number;
  indexInPage: number;
  position: number;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getNavigationInfo = <T extends BaseEntity>(
  selectedEntity: T | null,
  entities: T[],
  totalCount: number,
  pagination: PaginationState
): NavigationInfo => {
  if (!selectedEntity) {
    return {
      currentIndex: -1,
      totalCount: 0,
      hasPrev: false,
      hasNext: false,
      currentPosition: 0,
      prevTarget: null,
      nextTarget: null,
    };
  }

  const currentIndex = entities.findIndex(
    (entity) => entity.id === selectedEntity.id
  );

  if (currentIndex === -1) {
    return {
      currentIndex: -1,
      totalCount,
      hasPrev: false,
      hasNext: false,
      currentPosition: 0,
      prevTarget: null,
      nextTarget: null,
    };
  }

  const currentPage = pagination.page;
  const pageSize = pagination.pageSize;
  const actualPosition = (currentPage - 1) * pageSize + currentIndex + 1;

  const prevPosition = actualPosition - 1;
  const nextPosition = actualPosition + 1;

  const prevTarget: NavigationTarget | null =
    prevPosition > 0
      ? {
          page: Math.ceil(prevPosition / pageSize),
          indexInPage: (prevPosition - 1) % pageSize,
          position: prevPosition,
        }
      : null;

  const nextTarget: NavigationTarget | null =
    nextPosition <= totalCount
      ? {
          page: Math.ceil(nextPosition / pageSize),
          indexInPage: (nextPosition - 1) % pageSize,
          position: nextPosition,
        }
      : null;

  return {
    currentIndex,
    totalCount,
    hasPrev: prevTarget !== null,
    hasNext: nextTarget !== null,
    currentPosition: actualPosition,
    prevTarget,
    nextTarget,
  };
};

export interface NavigationActions<T extends BaseEntity> {
  handleNavigateToPrevious: () => Promise<void>;
  handleNavigateToNext: () => Promise<void>;
}

export const createNavigationActions = <T extends BaseEntity>(
  getNavigationInfo: () => NavigationInfo,
  entities: T[],
  pagination: PaginationState,
  callbacks: {
    onEntitySelect: (entity: T) => void;
    onPageChange: (page: number) => void;
    loadEntities: () => Promise<void>;
    saveStateToURL: () => Promise<void>;
    setPendingNavigation: (navigation: { targetIndex: number; type: "previous" | "next" } | null) => void;
  }
): NavigationActions<T> => {
  const handleNavigateToPrevious = async () => {
    const navInfo = getNavigationInfo();

    if (!navInfo.prevTarget) {
      return;
    }

    const { prevTarget } = navInfo;
    const currentPage = pagination.page;

    if (prevTarget.page === currentPage) {
      const prevEntity = entities[prevTarget.indexInPage];
      if (prevEntity) {
        const entity = { ...prevEntity } as T;
        callbacks.onEntitySelect(entity);
        await callbacks.saveStateToURL();
      }
    } else {
      callbacks.onPageChange(prevTarget.page);
      callbacks.setPendingNavigation({
        targetIndex: prevTarget.indexInPage,
        type: "previous",
      });
      await callbacks.loadEntities();
    }
  };

  const handleNavigateToNext = async () => {
    const navInfo = getNavigationInfo();

    if (!navInfo.nextTarget) {
      return;
    }

    const { nextTarget } = navInfo;
    const currentPage = pagination.page;

    if (nextTarget.page === currentPage) {
      const nextEntity = entities[nextTarget.indexInPage];
      if (nextEntity) {
        const entity = { ...nextEntity } as T;
        callbacks.onEntitySelect(entity);
        await callbacks.saveStateToURL();
      }
    } else {
      callbacks.onPageChange(nextTarget.page);
      callbacks.setPendingNavigation({
        targetIndex: nextTarget.indexInPage,
        type: "next",
      });
      await callbacks.loadEntities();
    }
  };

  return {
    handleNavigateToPrevious,
    handleNavigateToNext,
  };
};