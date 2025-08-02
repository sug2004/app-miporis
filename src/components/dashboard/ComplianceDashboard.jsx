import { useState, useEffect, useContext } from "react";
import { MetricsOverview } from "./MetricsOverview";
import { ControlEffectivenessCard } from "./ControlEffectivenessCard";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import { ControlWeaknessesCard } from "./ControlWeaknessesCard";
import { EvidenceUpliftTable } from "./EvidenceUpliftTable";
import { QuarterlyTrendChart } from "./QuarterlyTrendChart";
import { RecentActivity } from "./RecentActivity";
import { TeamMembersPopup } from "./TeamMembersPopup";
import { AppContext } from "../../context/AppContext";
import axios from "axios";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

export function ComplianceDashboard() {
  const { controlData } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [overallScore, setOverallScore] = useState(null);
  const [overallCompliancePercentage, setOverallCompliancePercentage] = useState(0);
  const [scoreStatus, setScoreStatus] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [historyData, setHistoryData] = useState([]);
  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [metrics, setMetrics] = useState({
    totalControls: 0,
    activeRisks: 0,
    evidenceItems: 0,
    teamMembers: 1
  });
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [evidenceRecommendations, setEvidenceRecommendations] = useState([]);
  const [quarterlyTrend, setQuarterlyTrend] = useState([]);
  const [userId, setUserId] = useState(null);
  const [controlDataState, setControlDataState] = useState([
    { title: 'GRC' },
    { title: 'Operational' },
    { title: 'Other policies' },
    { title: 'Strategic' },
    { title: 'Financial' }
  ]);
  const [controlWeaknesses, setControlWeaknesses] = useState([]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      const decodedToken = jwtDecode(token);
      if (decodedToken.name) {
        setUserName(decodedToken.name.split(' ')[0] || "User");
      }

      if (decodedToken.id) {
        setUserId(decodedToken.id);
        fetchAnalyticsData(decodedToken.id);
        fetchTeamMembersCount(decodedToken.id);

        // Fetch recent history
        axios.get('/api/history', { params: { userId: decodedToken.id, limit: 10 } })
          .then(response => {
            setHistoryData(response.data);

            const activities = response.data.slice(0, 3).map(item => {
              let activityType, status;

              if (item.compliant_result === "C") {
                activityType = "evidence_uploaded";
                status = "success";
              } else if (item.compliant_result === "PC" || item.compliant_result === "WE") {
                activityType = "control_review";
                status = "pending";
              } else {
                activityType = "risk_identified";
                status = "warning";
              }

              return {
                type: activityType,
                title: `Control ${item["Control ID"]} updated`,
                description: `${item["Control header"]} - ${item.compliant_result}`,
                time: new Date(item.updatedAt).toLocaleString(),
                status: status,
                icon: activityType === "evidence_uploaded" ? "CheckCircle2" :
                  activityType === "control_review" ? "Clock" : "Activity"
              };
            });

            setRecentActivities(activities);
          })
          .catch(error => {
            console.error("Error fetching history data:", error);
          });
      }
    }
  }, []);

//  const fetchTeamMembersCount = async (userId) => {
//   try {
//     const token = Cookies.get('token');
//     console.log('Fetching team members with token:', token ? 'Present' : 'Missing');
    
//     const response = await axios.get('/api/auth/team-members', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
    
//     console.log('Team members API response:', response.data);
    
//     setMetrics(prev => ({
//       ...prev,
//       teamMembers: response.data?.teamMembers?.length || 1
//     }));
//   } catch (error) {
//     console.error('Error fetching team members count:', error.response?.data || error.message);
//     setMetrics(prev => ({
//       ...prev,
//       teamMembers: 1
//     }));
//   }
// };


  // Fetch compliance data and update controlDataState
  
  const fetchTeamMembersCount = async (userId) => {
    try {
      const token = Cookies.get('token');
      console.log('Fetching team members with token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get('/api/auth/team-members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Team members API response:', response.data);
      
      // Add 1 to include the admin in the total count
      const teamMembersCount = (response.data?.teamMembers?.length || 0) + 1;
      
      setMetrics(prev => ({
        ...prev,
        teamMembers: teamMembersCount
      }));
    } catch (error) {
      console.error('Error fetching team members count:', error.response?.data || error.message);
      setMetrics(prev => ({
        ...prev,
        teamMembers: 1
      }));
    }
  };
  

  useEffect(() => {
    if (userId) {
      setLoading(true);
      axios.get(`/api/compliance-overview?userId=${userId}`)
        .then(response => {
          const data = response.data;
          const updatedControlData = controlDataState.map(item => {
            const matchedData = data.find(apiItem => apiItem.compliant_type === item.title);
            if (matchedData) {
              const totalRelevant = matchedData.total_Relevance || 0;
              const compliantCount = matchedData.total_result || 0;
              const compliancePercentage = totalRelevant > 0 ?
                ((compliantCount / totalRelevant) * 100).toFixed(1) : 0;

              return {
                ...item,
                ...matchedData,
                percent: parseFloat(compliancePercentage),
                compliancePercentage: parseFloat(compliancePercentage)
              };
            }
            return { ...item, percent: 0, compliancePercentage: 0 };
          });

          const sortedControlData = [
            ...updatedControlData.filter(item => item.compliant_type),
            ...updatedControlData.filter(item => !item.compliant_type)
          ];

          setControlDataState(sortedControlData);

          if (data && data.length > 0) {
            const totalRelevance = data.reduce((sum, item) => sum + (item.total_Relevance || 0), 0);
            const totalCompliant = data.reduce((sum, item) => sum + (item.total_result || 0), 0);
            const overallCompliance = totalRelevance > 0 ? 
              parseFloat(((totalCompliant / totalRelevance) * 100).toFixed(2)) : 0;
            
            setOverallCompliancePercentage(overallCompliance);

            const totalPercent = data.reduce((sum, item) => sum + item.percent, 0);
            const avgScore = Math.round(totalPercent / data.length);
            setOverallScore(avgScore);

            if (avgScore >= 85) {
              setScoreStatus("strong");
            } else if (avgScore >= 60) {
              setScoreStatus("moderate");
            } else {
              setScoreStatus("weak");
            }
          }

          const weaknessesData = sortedControlData.map(item => {
            const compliancePercent = item.percent || 0;
            const count = compliancePercent === 0 ? 1 : Math.max(1, Math.round((100 - compliancePercent) / 20));

            return {
              category: item.title,
              count: count,
              severity: compliancePercent < 50 ? "high" : compliancePercent < 70 ? "medium" : "low",
              percentage: compliancePercent === 0 ? 100 : Math.round(100 - compliancePercent),
              trend: compliancePercent === 0 ? "not-started" : compliancePercent > 40 ? "improving" : "stable",
              priority: compliancePercent < 50 ? "Critical" : compliancePercent < 70 ? "Important" : "Monitor"
            };
          }).sort((a, b) => b.percentage - a.percentage);

          setControlWeaknesses(weaknessesData);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
          setLoading(false);
        });
    }
  }, [userId]);

  const fetchAnalyticsData = async (userId) => {
    try {
      setChartLoading(true);

      // Use existing compliance-overview endpoint instead of analytics
      let currentAnalytics = { compliantPercentage: 0 };
      
      try {
        const complianceResponse = await axios.get(`/api/compliance-overview?userId=${userId}`);
        if (complianceResponse.data && complianceResponse.data.length > 0) {
          const data = complianceResponse.data;
          const totalRelevance = data.reduce((sum, item) => sum + (item.total_Relevance || 0), 0);
          const totalCompliant = data.reduce((sum, item) => sum + (item.total_result || 0), 0);
          const overallCompliance = totalRelevance > 0 ? 
            parseFloat(((totalCompliant / totalRelevance) * 100).toFixed(2)) : 0;
          currentAnalytics.compliantPercentage = overallCompliance;
        }
      } catch (error) {
        console.log('Using fallback analytics data');
        currentAnalytics.compliantPercentage = overallCompliancePercentage || 0;
      }

      const currentDate = new Date();
      const historicalData = [];

      for (let i = 12; i >= 0; i -= 3) {
        const pastDate = new Date();
        pastDate.setMonth(currentDate.getMonth() - i);

        historicalData.push({
          date: pastDate,
          quarter: getQuarterLabel(pastDate),
          value: null
        });
      }

      const historyResponse = await axios.get('/api/history', {
        params: { userId: userId }
      });

      const historyItems = historyResponse.data;

      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(currentDate.getMonth() - 1);

      let oldestItemDate = currentDate;
      if (historyItems.length > 0) {
        const createdDates = historyItems.map(item => new Date(item.createdAt || item.updatedAt));
        oldestItemDate = new Date(Math.min(...createdDates));
      }

      const isNewUser = oldestItemDate > oneMonthAgo;

      if (isNewUser) {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentValue = (currentAnalytics.compliantPercentage / 100) * 4;

        setQuarterlyTrend([
          {
            quarter: `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`,
            value: currentValue,
            change: 0
          }
        ]);

        setChartLoading(false);
        return;
      }

      const processedTrend = historicalData.map((quarterData, index) => {
        if (index === historicalData.length - 1) {
          return {
            quarter: quarterData.quarter,
            value: (currentAnalytics.compliantPercentage / 100) * 4,
            change: calculateChange(index > 0 ? historicalData[index - 1] : null, quarterData)
          };
        }

        const quarterEndDate = new Date(quarterData.date);
        quarterEndDate.setMonth(quarterData.date.getMonth() + 3);

        const relevantItems = historyItems.filter(item => {
          const itemDate = new Date(item.updatedAt);
          return itemDate <= quarterEndDate;
        });

        if (relevantItems.length > 0) {
          const compliantItems = relevantItems.filter(item => item.compliant_result === "C").length;
          const complianceRate = compliantItems / relevantItems.length;
          const scaledValue = Math.max(1, complianceRate * 4);

          return {
            quarter: quarterData.quarter,
            value: parseFloat(scaledValue.toFixed(2)),
            change: calculateChange(index > 0 ? historicalData[index - 1] : null, quarterData)
          };
        }

        const baseValue = 1 + (index * 0.5);
        return {
          quarter: quarterData.quarter,
          value: Math.min(baseValue, 3.5),
          change: index > 0 ? 10 + (index * 5) : 0
        };
      });

      setQuarterlyTrend(processedTrend);
      setChartLoading(false);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setChartLoading(false);
      generateFallbackTrendData();
    }
  };

  const getQuarterLabel = (date) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const calculateChange = (previousData, currentData) => {
    if (!previousData || !previousData.value || !currentData.value) return 0;
    return Math.round(((currentData.value - previousData.value) / previousData.value) * 100);
  };

  const generateFallbackTrendData = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const baseValue = (overallScore / 100) * 4;

    setQuarterlyTrend([
      { quarter: `${monthNames[(currentMonth - 16 + 12) % 12]} ${currentYear - Math.ceil((currentMonth - 16 + 12) / 12)}`, value: Math.max(1, baseValue - 1.5), change: 0 },
      { quarter: `${monthNames[(currentMonth - 12 + 12) % 12]} ${currentYear - Math.ceil((currentMonth - 12 + 12) / 12)}`, value: Math.max(1.5, baseValue - 1.0), change: 33 },
      { quarter: `${monthNames[(currentMonth - 8 + 12) % 12]} ${currentYear - Math.ceil((currentMonth - 8 + 12) / 12)}`, value: Math.max(2.0, baseValue - 0.5), change: 14 },
      { quarter: `${monthNames[(currentMonth - 4 + 12) % 12]} ${currentYear - Math.ceil((currentMonth - 4 + 12) / 12)}`, value: Math.max(2.5, baseValue - 0.2), change: 13 },
      { quarter: `${monthNames[currentMonth]} ${currentYear}`, value: baseValue, change: 6 },
    ]);
  };

  useEffect(() => {
    if (controlData && controlData.length > 0) {
      processControlData();
    }
  }, [controlData]);

  const processControlData = () => {
    let totalControls = 0;
    let activeRisks = 0;
    let evidenceItems = 0;

    let lowScore = 0;
    let mediumScore = 0;
    let highScore = 0;
    let excellentScore = 0;

    const weaknessesByProcess = {};
    const recommendations = [];

    controlData.forEach(framework => {
      if (framework.controls && Array.isArray(framework.controls)) {
        totalControls += framework.controls.length;

        framework.controls.forEach(control => {
          if (control.compliant_result === "NC" || control.compliant_result === "WE") {
            activeRisks++;

            const process = control.Process || "Other";
            if (!weaknessesByProcess[process]) {
              weaknessesByProcess[process] = {
                category: process,
                count: 0,
                severity: "medium",
                percentage: 0,
                trend: "stable",
                priority: "Important"
              };
            }

            weaknessesByProcess[process].count++;

            if (control.compliant_result === "NC") {
              weaknessesByProcess[process].severity = "high";
              weaknessesByProcess[process].priority = "Critical";
            }
          }

          if (control.compliant_result === "PC" || control.compliant_result === "WE") {
            let suggestion = "";
            let priority = "Medium";
            let impact = 70;

            if (control.compliant_result === "PC") {
              suggestion = `Enhance ${control["Control header"]} documentation`;
              priority = "Medium";
              impact = 70 + Math.floor(Math.random() * 15);
            } else {
              suggestion = `Implement ${control["Control header"]} process`;
              priority = "High";
              impact = 85 + Math.floor(Math.random() * 10);
            }

            recommendations.push({
              controlId: control["Control ID"],
              suggestion,
              priority,
              impact,
              category: control.Process || "General"
            });
          }

          if (control.uploadHistory && Array.isArray(control.uploadHistory)) {
            evidenceItems += control.uploadHistory.length;
          }

          const score = control.score || 0;
          if (score < 50) {
            lowScore++;
          } else if (score < 70) {
            mediumScore++;
          } else if (score < 90) {
            highScore++;
          } else {
            excellentScore++;
          }
        });
      }
    });

    setMetrics(prev => ({
      ...prev,
      totalControls,
      activeRisks,
      evidenceItems
    }));

    const totalControlsCount = lowScore + mediumScore + highScore + excellentScore;
    setScoreDistribution([
      {
        range: "0-49%",
        value: lowScore,
        percentage: totalControlsCount ? Math.round((lowScore / totalControlsCount) * 100) : 0,
        label: "Not Compliance",
        status: "critical",
        color: "hsl(var(--destructive))"
      },
      {
        range: "50-69%",
        value: mediumScore,
        percentage: totalControlsCount ? Math.round((mediumScore / totalControlsCount) * 100) : 0,
        label: "Weak Evidence",
        status: "moderate",
        color: "hsl(var(--warning))"
      },
      {
        range: "70-89%",
        value: highScore,
        percentage: totalControlsCount ? Math.round((highScore / totalControlsCount) * 100) : 0,
        label: "Partially Compliance",
        status: "good",
        color: "hsl(var(--info))"
      },
      {
        range: "90-100%",
        value: excellentScore,
        percentage: totalControlsCount ? Math.round((excellentScore / totalControlsCount) * 100) : 0,
        label: "Compliance",
        status: "excellent",
        color: "hsl(var(--success))"
      }
    ]);

    const weaknessesArray = Object.values(weaknessesByProcess);
    const totalWeaknesses = weaknessesArray.reduce((sum, item) => sum + item.count, 0);

    setWeaknesses(
      weaknessesArray.map(weakness => ({
        ...weakness,
        percentage: totalWeaknesses ? Math.round((weakness.count / totalWeaknesses) * 100) : 0
      })).sort((a, b) => b.count - a.count).slice(0, 3)
    );

    setEvidenceRecommendations(
      recommendations.sort((a, b) => b.impact - a.impact).slice(0, 5)
    );
  };

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="w-full space-y-6 pt-10">
        {/* Header */}
        <div className="mb-8 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {userName} 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your compliance program today
          </p>
        </div>

        {/* Metrics Overview */}
        <div className="px-2 sm:px-4 md:px-6 lg:px-8">
          <MetricsOverview
            metrics={[
              {
                title: "Controls in Scope",
                value: metrics.totalControls.toLocaleString(),
                change: "+12%",
                trend: "up",
                icon: "FileCheck",
                color: "text-chart-1",
                bgColor: "bg-chart-1/10",
                status: "Excellent",
                subtitle: "Controls managed",
                path: "/home/GRC/compliant list"
              },
              {
                title: "⚠Controls Pending Review",
                value: metrics.activeRisks.toLocaleString(),
                change: metrics.activeRisks > 50 ? "+8%" : "-8%",
                trend: metrics.activeRisks > 50 ? "up" : "down",
                icon: "AlertCircle",
                color: "text-warning",
                bgColor: "bg-warning/10",
                status: metrics.activeRisks > 50 ? "Increasing" : "Improving",
                subtitle: "Risks identified",
                path: "/home/GRC/compliant list?type=NC"
              },
              {
                title: "Controls with Evidence",
                value: metrics.evidenceItems.toLocaleString(),
                change: "+24%",
                trend: "up",
                icon: "TrendingUp",
                color: "text-success",
                bgColor: "bg-success/10",
                status: "Growing",
                subtitle: "Evidence collected",
                path: "/history"
              },
              {
                title: "👥* Users Active*",
                value: metrics.teamMembers.toLocaleString(),
                change: "+0%",
                trend: "up",
                icon: "Users",
                color: "text-chart-4",
                bgColor: "bg-chart-4/10",
                status: "Active",
                subtitle: "Active users",
                onClick: () => setShowTeamPopup(true)
              }
            ]}
          />
        </div>

        {/* Effectiveness + Score + Trend */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-2 sm:px-4 md:px-6 lg:px-8 items-stretch">
          <div className="md:col-span-3">
            <div className="h-full bg-card rounded-xl p-4 transition-transform duration-300 hover:scale-[1.01] flex flex-col">
              <ControlEffectivenessCard
                score={overallCompliancePercentage}
                status={scoreStatus}
                loading={loading}
                compact={true}
              />
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="h-full bg-card rounded-xl p-4 transition-transform duration-300 hover:scale-[1.01] flex flex-col">
              <ScoreDistributionChart data={scoreDistribution} />
            </div>
          </div>

          <div className="md:col-span-5">
            <div className="h-full bg-card rounded-xl p-4 transition-transform duration-300 hover:scale-[1.01] flex flex-col">
              <QuarterlyTrendChart
                data={quarterlyTrend}
                loading={chartLoading}
                compliancePercentage={overallCompliancePercentage}
              />
            </div>
          </div>
        </div>

        {/* Evidence + Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2 sm:px-4 md:px-6 lg:px-8 pb-6">
          <div className="md:col-span-2 transition-transform duration-300 hover:scale-[1.01] rounded-xl">
            <EvidenceUpliftTable data={evidenceRecommendations} />
          </div>
          <div className="transition-transform duration-300 hover:scale-[1.01] rounded-xl">
            <RecentActivity activities={recentActivities} />
          </div>
        </div>
      </main>

      {/* Team Members Popup */}
      <TeamMembersPopup 
        isOpen={showTeamPopup} 
        onClose={() => setShowTeamPopup(false)} 
      />
    </div>
  );
}
