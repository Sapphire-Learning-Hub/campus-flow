export function mockRequest<T>(
  data: T,
  delay = 600,
  shouldFail = false,
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(new Error("请求失败，请稍后重试"));
        return;
      }

      resolve(data);
    }, delay);
  });
}
