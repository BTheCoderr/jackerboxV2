import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('JackerBox marketplace listing API/UI contract', () => {
  test('browsing is paginated, only approved, and uses bounded inputs', () => {
    const route = read('src/app/api/equipment/route.ts');
    expect(route).toContain("moderationStatus: 'APPROVED'");
    expect(route).toContain("isAvailable: true");
    expect(route).toContain("db.equipment.count({ where })");
    expect(route).toContain("skip: (pageRaw - 1) * limitRaw");
    expect(route).toContain("limitRaw > 50");
    expect(route).toContain("pagination: {");
  });

  test('the API returns real listing image and tag arrays', () => {
    const route = read('src/app/api/equipment/route.ts');
    expect(route).toContain('images: parseStoredStrings(item.imagesJson)');
    expect(route).toContain('tags: parseStoredStrings(item.tagsJson)');
    expect(route).not.toContain('return NextResponse.json({ equipment });');
  });

  test('search filter choices match the server schema and unsupported distance is never advertised', () => {
    const form = read('src/components/equipment/EquipmentSearch.tsx');
    const hook = read('src/hooks/use-equipment-search.ts');
    expect(form).toContain('VALID_CATEGORIES.map');
    expect(form).toContain('searchParams.location || ""');
    expect(form).not.toContain('Use My Location');
    expect(form).not.toContain('value: "distance"');
    expect(hook).toContain("urlParams.set('location', params.location)");
  });

  test('browse page renders a single interactive listing grid and legacy links resolve', () => {
    const page = read('src/app/routes/equipment/page.tsx');
    const grid = read('src/components/equipment/equipment-grid.tsx');
    expect(page).toContain('<ClientEquipmentSearch defaultValues={searchValues} />');
    expect(page).not.toContain('<EquipmentGrid />');
    expect(grid).toContain('href={`/routes/equipment/${item.id}`}');
    expect(grid).not.toContain('href={`/equipment/${item.id}`}');
  });
});
