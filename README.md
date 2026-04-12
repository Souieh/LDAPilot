# LDAP Directory Manager

A modern, clean, and easy-to-use LDAP client for managing Samba4 Directory Services. Built with Next.js, shadcn/ui, and Lucide icons.

## Features

- **Multi-Profile Configuration**: Store and manage multiple LDAP connection profiles locally
- **Secure Authentication**: Session-based authentication against your LDAP directory
- **System Dashboard**: Real-time statistics for users, groups, and computer objects
- **AD Management**: Browse and manage:
  - Users with account status, email, and more
  - Computers and workstations
  - Groups and group memberships
  - Organizational Units (OUs) with tree navigation
- **DNS Manager**: Full DNS record management with support for all record types:
  - A, AAAA, CNAME, MX, NS, TXT, SOA, SRV, PTR, CAA
- **Rich Data Display**: Advanced filtering, sorting, and search capabilities
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Zero Configuration Hardcoding**: All UI labels, LDAP attributes, and DNS types are externalized constants

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Icons**: Lucide React
- **LDAP**: ldapts (pure JavaScript LDAP client)
- **Storage**: Local file-based configuration (server-side)
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner

## Project Structure

```
app/
├── page.tsx                    # Home page
├── settings/
│   └── page.tsx               # LDAP configuration management
├── ad-management/
│   └── page.tsx               # AD browsing and management
├── dns-manager/
│   └── page.tsx               # DNS record management
├── api/
│   ├── config/
│   │   ├── profiles/
│   │   │   ├── route.ts       # List and create profiles
│   │   │   └── [id]/route.ts  # Update and delete profiles
│   │   └── active/route.ts    # Manage active profile
│   └── ldap/
│       ├── test-connection/   # Test LDAP connection
│       ├── ous/              # Get OUs
│       └── search/           # Search objects (users, computers, groups)
├── layout.tsx                 # Root layout
└── globals.css               # Global styles

components/
├── header.tsx                 # Navigation header
├── data-table.tsx            # Reusable data table with sorting and actions
├── filter-form.tsx           # Reusable filter form
├── modal.tsx                 # Reusable modal dialog
├── dynamic-form.tsx          # Dynamic form builder
└── ou-tree-sidebar.tsx       # OU tree navigation

lib/
├── constants/
│   ├── ui-labels.ts          # All UI text labels
│   ├── ldap-attributes.ts    # LDAP object attributes and account control flags
│   └── dns-record-types.ts   # DNS record type definitions
├── types/
│   └── config.ts             # TypeScript interfaces for config and AD objects
└── server/
    ├── config-service.ts     # Configuration file management
    └── ldap-service.ts       # LDAP operations
```

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A Samba4 Domain Controller with LDAP enabled
- LDAP bind credentials (usually an admin account)

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Initial Configuration

1. **Create LDAP Profile**: Go to Settings and create your first LDAP connection profile
   - Hostname: Your DC hostname or IP
   - Port: 389 (LDAP) or 636 (LDAPS)
   - Bind DN: Admin account DN (e.g., `cn=Administrator,cn=Users,dc=example,dc=com`)
   - Domain: Your domain name
   - Base DN: Your base DN (e.g., `dc=example,dc=com`)

2. **Test Connection**: Use the test button to verify your connection works

3. **Start Managing**: Navigate to AD Management or DNS Manager to begin

## Architecture Highlights

### Reusability & Clean Code

All components follow these principles:

- **Single Responsibility**: Each component does one thing well
- **Props-Based Configuration**: No hardcoded values
- **Maximum 150-200 Lines**: Components are kept small for easy maintenance
- **Composable**: Components work together seamlessly

### Key Reusable Components

| Component       | Purpose                                    | Usage                            |
| --------------- | ------------------------------------------ | -------------------------------- |
| `DataTable`     | Display and manage any list of objects     | AD objects, DNS records          |
| `FilterForm`    | Search and filter UI                       | All list pages                   |
| `Modal`         | Dialogs and confirmations                  | Editing, viewing, creating       |
| `DynamicForm`   | Auto-generate forms from field definitions | Profile creation, record editing |
| `OUTreeSidebar` | Navigate OU hierarchy                      | AD Management page               |

### Externalized Configuration

All UI text, attributes, and constants are externalized:

**UI Labels** (`lib/constants/ui-labels.ts`):

```typescript
export const UI_LABELS = {
  app: { title: 'LDAP Directory Manager' },
  navigation: { adManagement: 'AD Management' },
  // ... all UI strings
};
```

**LDAP Attributes** (`lib/constants/ldap-attributes.ts`):

```typescript
export const LDAP_ATTRIBUTES = {
  user: {
    attributes: ['cn', 'sAMAccountName', 'mail', ...],
    editable: ['displayName', 'mail', ...]
  },
  // ... other object types
}
```

**DNS Record Types** (`lib/constants/dns-record-types.ts`):

```typescript
export const DNS_RECORD_TYPES = {
  A: { name: 'A', description: 'IPv4 Address' },
  // ... all record types
};
```

## Configuration Management

Configurations are stored in `./config/profiles.json` (server-side):

```json
[
  {
    "id": "profile_1234567890",
    "name": "Production DC",
    "isActive": true,
    "config": {
      "id": "profile_1234567890",
      "hostname": "dc.example.com",
      "port": 389,
      "protocol": "ldap",
      "domain": "example.com",
      "baseDN": "dc=example,dc=com",
      "created": "2024-01-15T10:00:00Z",
      "modified": "2024-01-15T10:00:00Z"
    }
  }
]
```

## API Endpoints

### Configuration Endpoints

- `GET /api/config/profiles` - List all profiles
- `POST /api/config/profiles` - Create new profile
- `PUT /api/config/profiles/[id]` - Update profile
- `DELETE /api/config/profiles/[id]` - Delete profile
- `GET /api/config/active` - Get active profile
- `POST /api/config/active` - Set active profile

### LDAP Endpoints

- `POST /api/ldap/test-connection` - Test LDAP connection
- `GET /api/ldap/ous` - Get all OUs (requires `x-ldap-password` header)
- `POST /api/ldap/search` - Search objects (users, computers, groups)

## Security Considerations

⚠️ **Important Security Notes**:

1. **Password Handling**: LDAP passwords are:
   - Passed in request headers, not stored
   - Only kept in client memory during session
   - Never persisted to disk

2. **Configuration Files**: Profile files (`./config/profiles.json`) contain:
   - Hostname, port, protocol
   - Bind DN
   - BUT NOT passwords

3. **Recommendations**:
   - Use LDAPS (636) for encrypted connections
   - Create a dedicated admin account for this tool
   - Restrict file access to the config directory
   - Run behind authentication/firewall in production

## Development Guidelines

### Adding a New Attribute Type

1. Update `lib/constants/ldap-attributes.ts`
2. Add to appropriate object class array
3. Component automatically includes it

### Creating a New Page

1. Follow the existing page pattern
2. Use reusable components (DataTable, FilterForm, Modal)
3. Keep pages to ~150-200 lines
4. Extract business logic to lib/server or lib/types

### Adding DNS Record Type Support

1. Add to `lib/constants/dns-record-types.ts`
2. Component automatically offers it in forms

## Performance Tips

- **Lazy Loading**: OUs are loaded on-demand when selected
- **Efficient Searching**: Client-side filtering for responsive UX
- **Connection Pooling**: LDAP connections are created per-request
- **Caching**: Consider adding Redis for frequently accessed data

## Troubleshooting

### Connection Failed

1. Check hostname and port are correct
2. Verify Bind DN is properly formatted
3. Ensure password is correct
4. Try LDAPS (636) if LDAP (389) fails

### OUs Not Showing

1. Verify Base DN is correct
2. Check LDAP permissions for your bind account
3. Ensure OUs exist in directory

### Form Not Saving

1. Check browser console for errors
2. Verify all required fields are filled
3. Check server logs for API errors

## Future Enhancements

- [ ] User creation/modification forms
- [ ] Group membership management
- [ ] Bulk operations
- [ ] Export to CSV/Excel
- [ ] Activity logging
- [ ] User authentication (optional)
- [ ] Dark mode toggle
- [ ] Advanced LDAP filters
- [ ] Schema browser

## License

MIT

## Contributing

Contributions welcome! Please ensure:

- No hardcoded values
- Keep components small and focused
- Use TypeScript for type safety
- Follow existing code style
