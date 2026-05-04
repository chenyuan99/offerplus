import React, { useState } from 'react';
import SEO from '../components/SEO';
import '../styles/animations.css';

// Tableau viz component type declaration
interface TableauVizProps extends React.HTMLAttributes<HTMLElement> {
  src?: string;
  'hide-tabs'?: boolean;
  toolbar?: string;
  device?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'tableau-viz': TableauVizProps;
    }
  }
}

export function Rice() {

  return (
    <div className="w-full h-screen flex flex-col">
      <SEO 
        title="Rice University Salary Data | OffersPlus" 
        description="View and analyze salary data for Rice University graduates and employees"
      />
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
                Rice STEM 找工作交流
            </h1>
            <a
                href="https://docs.google.com/spreadsheets/d/1PEebPo6zZqsy-P2gdw6aOZYlPOZOui8Yz89yRNi7pDw/edit?gid=0#gid=0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Contribute to the List
            </a>
            <a
                href="https://docs.google.com/spreadsheets/d/1PEebPo6zZqsy-P2gdw6aOZYlPOZOui8Yz89yRNi7pDw/edit?gid=0#gid=0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                微信群二维码
            </a>
            <a
                href="https://docs.google.com/spreadsheets/d/1PEebPo6zZqsy-P2gdw6aOZYlPOZOui8Yz89yRNi7pDw/edit?gid=0#gid=0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                职场圆桌会
            </a>

            <a
                href="https://docs.google.com/spreadsheets/d/1PEebPo6zZqsy-P2gdw6aOZYlPOZOui8Yz89yRNi7pDw/edit?gid=0#gid=0"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                求职分享会
            </a>
        </div>

        <div className="max-w-4xl mx-auto w-full px-4 mb-8">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">群公告 Group Announcements</h2>

            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border-l-4 border-indigo-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">【群规】</h3>
                <p className="text-gray-700 mb-3">
                  本群为Rice中国学生找工作交流群，包含研究生和本科同学，欢迎大家积极讨论笔试、面试经验，RCSSA也会不定期组织职场学长来分享找工、面试等经验～
                </p>
                <p className="text-gray-600 text-sm">群名片格式：名称-毕业年份-专业 (如：Silas-2025-MCSE)</p>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2026春Rice职场圆桌会</h3>
                <a
                  href="https://docs.google.com/document/d/1MGEVfq_AFZx0Ce89ifuPRuQHUJkofRdyA4v3rMVggGU/edit?tab=t.0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  📄 内容总结 →
                </a>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">2025Rice中国学生Tech找工分享会</h3>
                <div className="space-y-2">
                  <a
                    href="https://docs.google.com/presentation/d/1FGbJEKB9qNxASpsZmwxP4ZeV4juvRd5_P_xKkH9wgpo/edit?usp=sharing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    📑 Slide链接（含嘉宾分享素材）→
                  </a>
                  <a
                    href="https://riceuniversity.zoom.us/rec/share/AHotOsUtmr2bjcXJ4DLZiqvfF8Uu7RwfsyIMnjMkYfkURxmeXX2VT6MT_0s-O75K.eJt1AQz2lFL7U6BT?startTime=1757123980000"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    🎥 录屏链接 (00:05:50开始) →
                  </a>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">2025Rice校友内推Referral</h3>
                <p className="text-gray-700 mb-3">
                  校友内推动态，包含实习、正式，欢迎在职的校友补充信息！
                </p>
                <a
                  href="https://docs.google.com/spreadsheets/d/1PEebPo6zZqsy-P2gdw6aOZYlPOZOui8Yz89yRNi7pDw/edit?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-md font-medium text-sm"
                >
                  查看内推表 →
                </a>
              </div>
            </div>
          </div>
        </div>

      <div className="flex-1 w-full">
        <iframe 
          src="https://docs.google.com/spreadsheets/d/e/2PACX-1vSg3Wh05CgFeOQAd_jojLa6nbgRlC_YvqYcYd9X8WNg-O-iYLfCuyOYyQV_eMJOSnSHxr8JP8ZYnPxN/pubhtml?gid=0&single=true&widget=true&headers=false"
          title="Rice University Salary Data"
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}