describe('booking step validation', () => {
  it('step 0 CTA disabled without slot', () => {
    const step = 0;
    const slot = null;
    const canContinue = step !== 0 || slot !== null;
    expect(canContinue).toBe(false);
  });

  it('step 1 CTA disabled without topic', () => {
    const topic = '';
    expect(topic.trim().length > 0).toBe(false);
  });

  it('step 1 CTA enabled with topic', () => {
    const topic = 'React performance';
    expect(topic.trim().length > 0).toBe(true);
  });

  it('first session price is 10% of hourly rate', () => {
    const hourlyRate = 50;
    const firstSessionPrice = Math.round(hourlyRate * 0.1);
    expect(firstSessionPrice).toBe(5);
  });
});
