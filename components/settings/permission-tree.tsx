"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PermissionsStructure } from "@/lib/permissions"

interface PermissionTreeProps {
  permissions: PermissionsStructure
  onChange: (permissions: PermissionsStructure) => void
  disabled?: boolean
}

export function PermissionTree({ permissions, onChange, disabled = false }: PermissionTreeProps) {
  const updateMenuPermission = (menu: keyof PermissionsStructure["menus"], value: boolean) => {
    onChange({
      ...permissions,
      menus: {
        ...permissions.menus,
        [menu]: value,
      },
    })
  }

  const updateSettingsPermission = (
    setting: keyof PermissionsStructure["menus"]["settings"],
    value: boolean
  ) => {
    onChange({
      ...permissions,
      menus: {
        ...permissions.menus,
        settings: {
          ...permissions.menus.settings,
          [setting]: value,
        },
      },
    })
  }

  const updateDataAccess = (
    entity: keyof PermissionsStructure["dataAccess"],
    value: "all" | "assigned"
  ) => {
    onChange({
      ...permissions,
      dataAccess: {
        ...permissions.dataAccess,
        [entity]: value,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Menu Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Access</CardTitle>
          <CardDescription>
            Select which menus this role can access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="menu-dashboard"
                checked={permissions.menus.dashboard}
                onCheckedChange={(checked) => updateMenuPermission("dashboard", !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="menu-dashboard" className="cursor-pointer">
                Dashboard
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="menu-leads"
                checked={permissions.menus.leads}
                onCheckedChange={(checked) => updateMenuPermission("leads", !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="menu-leads" className="cursor-pointer">
                Leads
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="menu-investors"
                checked={permissions.menus.investors}
                onCheckedChange={(checked) => updateMenuPermission("investors", !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="menu-investors" className="cursor-pointer">
                Investors
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="menu-activities"
                checked={permissions.menus.activities}
                onCheckedChange={(checked) => updateMenuPermission("activities", !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="menu-activities" className="cursor-pointer">
                Activities
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="menu-reports"
                checked={permissions.menus.reports}
                onCheckedChange={(checked) => updateMenuPermission("reports", !!checked)}
                disabled={disabled}
              />
              <Label htmlFor="menu-reports" className="cursor-pointer">
                Reports
              </Label>
            </div>
          </div>

          {/* Settings Sub-Menu */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Settings Access</h4>
            <div className="grid grid-cols-2 gap-4 ml-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="settings-leadFields"
                  checked={permissions.menus.settings.leadFields}
                  onCheckedChange={(checked) => updateSettingsPermission("leadFields", !!checked)}
                  disabled={disabled}
                />
                <Label htmlFor="settings-leadFields" className="cursor-pointer">
                  Lead Fields
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="settings-investorFields"
                  checked={permissions.menus.settings.investorFields}
                  onCheckedChange={(checked) => updateSettingsPermission("investorFields", !!checked)}
                  disabled={disabled}
                />
                <Label htmlFor="settings-investorFields" className="cursor-pointer">
                  Investor Fields
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="settings-activityTypes"
                  checked={permissions.menus.settings.activityTypes}
                  onCheckedChange={(checked) => updateSettingsPermission("activityTypes", !!checked)}
                  disabled={disabled}
                />
                <Label htmlFor="settings-activityTypes" className="cursor-pointer">
                  Activity Types
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="settings-users"
                  checked={permissions.menus.settings.users}
                  onCheckedChange={(checked) => updateSettingsPermission("users", !!checked)}
                  disabled={disabled}
                />
                <Label htmlFor="settings-users" className="cursor-pointer">
                  Users
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="settings-roles"
                  checked={permissions.menus.settings.roles}
                  onCheckedChange={(checked) => updateSettingsPermission("roles", !!checked)}
                  disabled={disabled}
                />
                <Label htmlFor="settings-roles" className="cursor-pointer">
                  Roles & Permissions
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Access Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Data Access Control</CardTitle>
          <CardDescription>
            Configure data visibility for leads, investors, and activities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Leads Access */}
          <div>
            <Label className="text-base font-medium">Leads</Label>
            <RadioGroup
              value={permissions.dataAccess.leads}
              onValueChange={(value) => updateDataAccess("leads", value as "all" | "assigned")}
              disabled={disabled}
              className="mt-3 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="leads-all" />
                <Label htmlFor="leads-all" className="cursor-pointer font-normal">
                  View all leads
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assigned" id="leads-assigned" />
                <Label htmlFor="leads-assigned" className="cursor-pointer font-normal">
                  View only assigned leads
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Investors Access */}
          <div>
            <Label className="text-base font-medium">Investors</Label>
            <RadioGroup
              value={permissions.dataAccess.investors}
              onValueChange={(value) => updateDataAccess("investors", value as "all" | "assigned")}
              disabled={disabled}
              className="mt-3 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="investors-all" />
                <Label htmlFor="investors-all" className="cursor-pointer font-normal">
                  View all investors
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assigned" id="investors-assigned" />
                <Label htmlFor="investors-assigned" className="cursor-pointer font-normal">
                  View only assigned investors
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Activities Access */}
          <div>
            <Label className="text-base font-medium">Activities</Label>
            <RadioGroup
              value={permissions.dataAccess.activities}
              onValueChange={(value) => updateDataAccess("activities", value as "all" | "assigned")}
              disabled={disabled}
              className="mt-3 space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="activities-all" />
                <Label htmlFor="activities-all" className="cursor-pointer font-normal">
                  View all activities
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="assigned" id="activities-assigned" />
                <Label htmlFor="activities-assigned" className="cursor-pointer font-normal">
                  View only assigned activities
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
