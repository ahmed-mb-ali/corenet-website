"use client";
import { useEffect } from "react";

export default function HiresPage() {
  useEffect(() => {
    window.location.replace("/#products");
  }, []);
  return null;
}
