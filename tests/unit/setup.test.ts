describe('Vitest setup', () => {
  it('should run a basic test', () => {
    expect(true).toBe(true);
  });

  it('should resolve path aliases', async () => {
    const coreModule = await import('@/core');
    expect(coreModule).toBeDefined();
  });
});
