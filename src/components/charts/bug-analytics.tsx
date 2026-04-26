"use client";

import { useRef } from "react";
// @ts-ignore
import domtoimage from "dom-to-image";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

type BugEnvironment = {
  device?: string;
  osVersion?: string;
  browser?: string;
  screenResolution?: string;
  country?: string;
};

interface BugReport {
  severity: string;
  environment: unknown;
  tester: {
    country?: string | null;
  };
  errorType?: string | null;
  feature?: string | null;
}

interface BugAnalyticsProps {
  bugReports: any[];
  campaignName: string;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

const COLORS = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#22c55e",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

export function BugAnalytics({ bugReports, campaignName }: BugAnalyticsProps) {
  const severityChartRef = useRef<HTMLDivElement>(null);
  const countryChartRef = useRef<HTMLDivElement>(null);
  const deviceChartRef = useRef<HTMLDivElement>(null);
  const errorTypeChartRef = useRef<HTMLDivElement>(null);

  // Process severity data
  const severityData = bugReports.reduce((acc, bug) => {
    const severity = bug.severity || "UNKNOWN";
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const severityChartData: ChartData[] = Object.entries(severityData).map(([name, value]) => ({
    name,
    value: value as number,
    color: COLORS[name as keyof typeof COLORS] || "#6b7280",
  }));

  // Process country data
  const countryData = bugReports.reduce((acc, bug) => {
    const env = bug.environment as BugEnvironment | null;
    const country = env?.country || bug.tester?.country || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const countryChartData: ChartData[] = Object.entries(countryData)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Process device data
  const deviceData = bugReports.reduce((acc, bug) => {
    const env = bug.environment as BugEnvironment | null;
    const device = env?.device || "Unknown";
    acc[device] = (acc[device] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const deviceChartData: ChartData[] = Object.entries(deviceData)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Process error type data
  const errorTypeData = bugReports.reduce((acc, bug) => {
    let errorType = bug.errorType || "Other";
    // Remove "optional" and parentheses from error type name
    errorType = errorType.replace(/optional/gi, "").replace(/\([^)]*\)/g, "").trim() || "Other";
    acc[errorType] = (acc[errorType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const errorTypeChartData: ChartData[] = Object.entries(errorTypeData)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const downloadChart = (ref: React.RefObject<HTMLDivElement | null>, title: string) => {
    if (!ref.current) return;
    
    const svg = ref.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${campaignName}-${title.toLowerCase().replace(/\s+/g, "-")}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const downloadAsPNG = async (ref: React.RefObject<HTMLDivElement | null>, title: string) => {
    if (!ref.current) return;
    
    try {
      const containerRect = ref.current.getBoundingClientRect();
      const width = Math.ceil(containerRect.width);
      const height = Math.ceil(containerRect.height);

      const dataUrl = await domtoimage.toPng(ref.current, {
        width: width,
        height: height,
        quality: 1,
        bgcolor: "#ffffff",
        style: {
          width: `${width}px`,
          height: `${height}px`,
        },
      });
      
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `${campaignName}-${title.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Failed to download PNG:", error);
    }
  };

  const ChartCard = ({ 
    title, 
    ref, 
    children, 
    onDownloadSVG, 
    onDownloadPNG 
  }: { 
    title: string; 
    ref: React.RefObject<HTMLDivElement | null>; 
    children: React.ReactNode;
    onDownloadSVG: () => void;
    onDownloadPNG: () => void;
  }) => (
    <div className="border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">{title}</h3>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onDownloadSVG}>
            Download SVG
          </Button>
          <Button variant="secondary" onClick={onDownloadPNG}>
            Download PNG
          </Button>
        </div>
      </div>
      <div ref={ref} className="h-80">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium">Bug Analytics</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard
          title="Severity Distribution"
          ref={severityChartRef}
          onDownloadSVG={() => downloadChart(severityChartRef, "Severity Distribution")}
          onDownloadPNG={() => downloadAsPNG(severityChartRef, "Severity Distribution")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={severityChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {severityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Country Distribution"
          ref={countryChartRef}
          onDownloadSVG={() => downloadChart(countryChartRef, "Country Distribution")}
          onDownloadPNG={() => downloadAsPNG(countryChartRef, "Country Distribution")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countryChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Device Distribution"
          ref={deviceChartRef}
          onDownloadSVG={() => downloadChart(deviceChartRef, "Device Distribution")}
          onDownloadPNG={() => downloadAsPNG(deviceChartRef, "Device Distribution")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deviceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Error Type Distribution"
          ref={errorTypeChartRef}
          onDownloadSVG={() => downloadChart(errorTypeChartRef, "Error Type Distribution")}
          onDownloadPNG={() => downloadAsPNG(errorTypeChartRef, "Error Type Distribution")}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={errorTypeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
