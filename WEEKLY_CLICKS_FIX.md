# Weekly Clicks Fix (本周点击修复)

## Problem
The "本周点击" (Weekly Clicks) statistic was always showing 0 because it was hardcoded as a placeholder.

## Root Causes

### 1. Stats API Issue
**File**: `src/app/api/stats/route.ts`

**Problem**: 
```typescript
// Old code - hardcoded to 0
const weeklyClicks = 0;
```

**Solution**:
- Calculate weekly clicks by summing `click_count` for websites that have `last_clicked_at` within the last 7 days
- Use Unix timestamp (seconds) for date comparison
- Properly filter by user_id and time range

```typescript
// New code - actual calculation
const weeklyClicksResult = await db.select({ 
  total: sql<number>`COALESCE(SUM(${websites.click_count}), 0)` 
})
  .from(websites)
  .where(
    sql`${websites.user_id} = ${userId} AND ${websites.last_clicked_at} >= ${sevenDaysAgoTimestamp}`
  );
const weeklyClicks = weeklyClicksResult[0]?.total || 0;
```

### 2. Click Tracking Issue
**File**: `src/app/api/websites/[id]/click/route.ts`

**Problem**: 
```typescript
// Old code - using JavaScript Date object
last_clicked_at: new Date(),
```

This might cause issues because the database expects Unix timestamp (integer), not a Date object.

**Solution**:
```typescript
// New code - Unix timestamp in seconds
last_clicked_at: Math.floor(Date.now() / 1000),
```

## How It Works Now

1. **When a user clicks a website**:
   - `click_count` increments by 1
   - `last_clicked_at` updates to current Unix timestamp

2. **When calculating weekly clicks**:
   - Calculate timestamp for 7 days ago
   - Sum all `click_count` values for websites where `last_clicked_at` >= 7 days ago
   - Return the total

## Important Notes

⚠️ **Limitation**: This approach counts the TOTAL clicks for websites that were clicked in the last 7 days, not the exact number of clicks that occurred in the last 7 days.

**Example**:
- Website A: clicked 100 times total, last clicked 2 days ago → counts as 100
- Website B: clicked 50 times total, last clicked 10 days ago → counts as 0
- Weekly clicks = 150

This is a reasonable approximation given the current database schema. For exact per-click tracking, you would need a separate `clicks` table with individual click records.

## Testing

To test the fix:
1. Click on some websites
2. Wait a few seconds
3. Refresh the dashboard
4. The "本周点击" stat should now show the sum of click counts for recently clicked websites

## Future Improvements

For more accurate weekly click tracking, consider:
1. Creating a separate `clicks` table to track individual click events
2. Storing timestamp for each click
3. Aggregating clicks by date range for precise statistics
