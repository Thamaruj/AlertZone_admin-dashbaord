import ConnectionTest from "./test-connection/page";

export default function Home() {
  return ( 
    <main className="p-8 ">
      <h1 className="text-4xl font-bold">Welcome to AlertZone</h1>
      <p className="mt-4 text-lg text-blue-500">Your Development Begins Here</p>
      <ConnectionTest/>
    </main>
  );
}