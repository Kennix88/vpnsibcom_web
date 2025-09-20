import { readFileSync } from 'fs'
import fs from 'fs/promises'
import path from 'path'

/**
 * Recursively loads all JSON files from a directory and merges them into a single object
 * @param dir - Directory path to scan
 * @returns Object with merged translations
 */
export async function loadTranslations(
  dir: string,
): Promise<Record<string, any>> {
  let result: Record<string, any> = {}

  try {
    // Check if directory exists
    await fs.access(dir)

    // Read directory contents
    const items = await fs.readdir(dir, { withFileTypes: true })

    // Process each item
    for (const item of items) {
      const itemPath = path.join(dir, item.name)

      // Skip _generated directory
      if (item.isDirectory() && item.name === '_generated') {
        continue
      }

      if (item.isDirectory()) {
        // Recursively load translations from subdirectory
        const nestedTranslations = await loadTranslations(itemPath)

        // Use directory name as namespace
        const namespace = item.name
        result[namespace] = nestedTranslations
      } else if (item.isFile() && item.name.endsWith('.json')) {
        try {
          // Load and parse JSON file
          const content = await fs.readFile(itemPath, 'utf-8')
          const translations = JSON.parse(content)

          // Get filename without extension as namespace
          const namespace = path.basename(item.name, '.json')

          if (namespace === 'index') {
            // Merge index.json contents directly into result
            result = { ...result, ...translations }
          } else {
            // Use filename as namespace
            result[namespace] = translations
          }
        } catch (error) {
          console.error(`Error loading translation file ${itemPath}:`, error)
        }
      }
    }
  } catch (error) {
    console.error(`Error accessing directory ${dir}:`, error)
  }

  return result
}

/**
 * Deep merges two objects with fallback to defaultObj for missing keys
 * @param targetObj - Target object to merge into
 * @param defaultObj - Default object with fallback values
 * @returns Merged object with fallbacks
 */
export function deepMergeWithFallback(
  targetObj: Record<string, any>,
  defaultObj: Record<string, any>,
): Record<string, any> {
  const result = { ...targetObj }

  // Iterate through all keys in default object
  for (const key in defaultObj) {
    // If key doesn't exist in target, use default value
    if (!(key in result)) {
      result[key] = defaultObj[key]
    }
    // If both values are objects, recursively merge them
    else if (
      typeof defaultObj[key] === 'object' &&
      defaultObj[key] !== null &&
      typeof result[key] === 'object' &&
      result[key] !== null
    ) {
      result[key] = deepMergeWithFallback(result[key], defaultObj[key])
    }
    // Otherwise keep the target value (already exists)
  }

  return result
}
