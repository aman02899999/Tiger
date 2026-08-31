import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

const projectId = "tiger-rules-test";
let testEnv;

const auth = (uid, token = {}) => testEnv.authenticatedContext(uid, token).firestore();
const profile = (id, plan = "Free") => ({
  id,
  name: id,
  email: `${id}@example.test`,
  avatar: "TT",
  phone: "",
  age: 25,
  gender: "other",
  height: 170,
  weight: 70,
  goal: "general",
  plan,
  joinDate: "2026-08-31",
  streak: 0,
  onboardingComplete: false,
  preferences: {},
  stats: {},
});

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "client-a"), { ...profile("client-a"), gymId: "gym-a", role: "client" });
    await setDoc(doc(db, "trainerClients", "gym-a_trainer-a_client-a"), {
      trainerId: "trainer-a", clientId: "client-a", gymId: "gym-a", status: "active",
    });
  });
});

after(async () => {
  await testEnv.cleanup();
});

test("an account owner may create only a safe Free profile", async () => {
  await assertSucceeds(setDoc(doc(auth("client-new"), "users", "client-new"), profile("client-new")));
  await assertFails(setDoc(doc(auth("client-paid"), "users", "client-paid"), profile("client-paid", "Elite")));
});

test("a browser cannot issue enrollment or entitlement documents", async () => {
  await assertFails(setDoc(doc(auth("client-a"), "courseEnrollments", "client-a", "courses", "course-1"), { courseId: "course-1" }));
  await assertFails(setDoc(doc(auth("client-a"), "entitlements", "client-a"), { status: "active" }));
});

test("an active same-gym trainer can read an assigned client profile", async () => {
  await assertSucceeds(getDoc(doc(auth("trainer-a", { role: "trainer", gymId: "gym-a" }), "users", "client-a")));
});

test("an unassigned or cross-gym trainer cannot read the client profile", async () => {
  await assertFails(getDoc(doc(auth("trainer-b", { role: "trainer", gymId: "gym-a" }), "users", "client-a")));
  await assertFails(getDoc(doc(auth("trainer-a", { role: "trainer", gymId: "gym-b" }), "users", "client-a")));
});

test("trainer-client relationships are server-managed", async () => {
  await assertFails(setDoc(doc(auth("trainer-a", { role: "trainer", gymId: "gym-a" }), "trainerClients", "gym-a_trainer-a_client-a"), { status: "inactive" }));
});
