# Case study: the search filter that undid itself

## Context

The jobs page keeps its filters in the URL so a search can be shared, bookmarked and restored with Back. Dropdowns write to the URL immediately. The search box waits until typing has stopped for 300 ms, then writes.

## Symptom

A component test clicked "Clear filters" on `/jobs?q=nothing&type=CONTRACT&sort=salary_desc` and expected `/jobs?sort=salary_desc`. It got `/jobs?sort=salary_desc&q=nothing`: the search the user had just cleared was back.

## Investigation

The test recorded the URL every 20 ms after the click. The URL was correct at first, then `q=nothing` came back for about 300 ms, and the job list fetched that search again before the URL settled. So the app recovered, but users would have seen cleared results flash back and caused an extra request.

## Cause

The effect that copies the debounced search text into the URL depended on the URL-update function. React Router replaces that function whenever the URL changes. Clearing the filters changed the URL, so the effect ran again, but the debounced value was still the old text, because its 300 ms timer had not fired yet. The effect wrote that stale text back.

This was the second bug in the same place. An earlier one lost the first of two quick changes, because `setSearchParams(prev => ...)` receives the URL from the last render; a small hook now builds each update on the latest requested URL.

## Fix

The effect now writes only when the debounced text matches what is in the inputs. Right after an outside change the two differ, so stale text is never written; once the debounce catches up they match.

## Proof

The test now also checks that no request with the cleared search is sent during the debounce window. With the fix removed, it fails.

## Lesson

A debounced value is a copy of state from the past; anything that acts on it must check that it is still current.
