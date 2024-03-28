import urling from 'urling';

export default class UtilitiesNodeJs {
  static async checkUrl(url: string): Promise<boolean> {
    //console.log(`urlExists(url: string): ${url}`);

    // Save the original console.info function
    const originalConsoleInfo = console.info;

    // Override console.info with a no-op function
    console.info = () => {};

    // Call the function
    const options = {
      url: url,
      immediate: true,
    };
    const result = await urling(options);

    // Restore the original console.info function
    console.info = originalConsoleInfo;

    return result == 200;
  }
}
