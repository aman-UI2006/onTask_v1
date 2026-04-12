export default function LoadingSpinner() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f0f0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ color: "#6d5dfc", fontSize: "16px" }}>Loading...</div>
    </div>
  );
}
