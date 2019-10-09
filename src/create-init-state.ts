export const createInitState = (data: any) => ({
  list: {
    isFetchLoading: false,
    isCountLoading: false,
    count: 0,
    data: []
  },
  model: {
    data,
    isLoading: false
  }
});
