export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  // For now, a simple centered message is perfect.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center">
        <p className="text-lg text-gray-600 dark:text-gray-300">Loading...</p>
        {/* You could add a spinner component here */}
      </div>
    </div>
  );
}