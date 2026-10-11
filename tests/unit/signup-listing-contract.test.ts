import fs from 'node:fs';
import path from 'node:path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('JackerBox signup and listing regression contracts', () => {
  test('registration preserves the account role instead of forcing both', () => {
    const route = read('src/app/api/auth/register/route.ts');
    expect(route).toContain('userType: z.enum(["renter", "owner", "both"]).default("both")');
    expect(route).toContain('password: hashedPassword, userType');
    expect(route).not.toContain('userType: "both"');
  });

  test('registration accepts an omitted phone and returns only safe profile fields', () => {
    const route = read('src/app/api/auth/register/route.ts');
    expect(route).toContain('value.trim() === "" ? undefined : value');
    expect(route).toContain('select: { id: true, name: true, email: true, userType: true }');
    expect(route).not.toContain('...userWithoutPassword');
  });

  test('signup checks the credential session before routing to the dashboard', () => {
    const form = read('src/components/auth/register-form.tsx');
    expect(form).toContain('!signInResult?.ok || signInResult.error');
    expect(form).toContain('router.replace("/auth/login?registered=1")');
    expect(form).toContain('router.replace("/routes/dashboard")');
    expect(form).not.toContain('signIn("apple"');
  });

  test('both listing entry points agree on 3 to 5 actual photos', () => {
    const create = read('src/app/api/equipment/route.ts');
    const newForm = read('src/app/routes/equipment/new/page.tsx');
    const oldForm = read('src/components/equipment/equipment-form.tsx');
    expect(create).toContain('MIN_REQUIRED_IMAGES = 3');
    expect(newForm).toContain("min(3, 'Add at least three photos').max(5)");
    expect(oldForm).toContain('MIN_REQUIRED_IMAGES = 3');
    expect(oldForm).toContain('MAX_ALLOWED_IMAGES = 5');
    expect(oldForm).not.toContain('source.unsplash.com/random');
    expect(oldForm).toContain('return null;');
  });
});
