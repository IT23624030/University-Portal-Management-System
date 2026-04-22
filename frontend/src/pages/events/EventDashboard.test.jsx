import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import EventDashboard from './EventDashboard';
import { AuthContext } from '../../context/AuthContext';
import { eventService, eventRequestService } from '../../utils/api';

// Mock the API services
jest.mock('../../utils/api', () => ({
    eventService: {
        getAllEvents: jest.fn(),
        getMyRegistrations: jest.fn(),
        register: jest.fn(),
        unregister: jest.fn(),
    },
    eventRequestService: {
        createRequest: jest.fn(),
    }
}));

// Mock SweetAlert2 to avoid popping up real alerts during tests
jest.mock('sweetalert2', () => ({
    fire: jest.fn().mockResolvedValue({ isConfirmed: true })
}));

jest.mock('lucide-react', () => {
    const FakeIcon = () => <div data-testid="lucide-icon" />;
    return {
        __esModule: true,
        Search: FakeIcon,
        Calendar: FakeIcon,
        Zap: FakeIcon,
        Globe: FakeIcon,
        Filter: FakeIcon,
        Lightbulb: FakeIcon,
        X: FakeIcon,
        Clock: FakeIcon,
        MapPin: FakeIcon,
        ChevronRight: FakeIcon,
        Users: FakeIcon,
        Info: FakeIcon,
        Settings: FakeIcon,
        UserMinus: FakeIcon,
        UserPlus: FakeIcon,
        Activity: FakeIcon,
        AlertCircle: FakeIcon,
        Building2: FakeIcon,
        Send: FakeIcon
    };
});

describe('EventDashboard Subsystem', () => {
    console.log('EventDashboard type:', typeof EventDashboard);
    console.log('AuthContext type:', typeof AuthContext, AuthContext);

    const mockUser = { _id: 'user1', name: 'Test Student', role: 'student' };

    const mockEvents = [
        {
            _id: 'event1',
            title: 'Tech Career Fair 2026',
            description: 'Annual fair',
            category: 'Seminar',
            date: '2026-05-10T10:00:00.000Z',
            time: '10:00 AM',
            location: 'Main Hall',
            organizer: { name: 'IT Faculty' },
            registeredCount: 50,
            capacity: 100,
            isTrending: true,
            status: 'Upcoming'
        },
        {
            _id: 'event2',
            title: 'AI Workshop',
            description: 'Hands-on AI',
            category: 'Workshop',
            date: '2026-05-15T14:00:00.000Z',
            time: '02:00 PM',
            location: 'Lab 1',
            organizer: { name: 'AI Society' },
            registeredCount: 120,
            capacity: 150,
            isTrending: false,
            status: 'Upcoming'
        }
    ];

    const mockRegistrations = [
        { _id: 'reg1', event: { _id: 'event1' } }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation((...args) => {
            console.log('REACT ERROR:', ...args);
        });
        
        // Setup default mock returns
        eventService.getAllEvents.mockResolvedValue({ data: mockEvents });
        eventService.getMyRegistrations.mockResolvedValue({ data: mockRegistrations });
    });

    const renderWithContext = () => {
        return render(
            <AuthContext.Provider value={{ user: mockUser }}>
                <BrowserRouter>
                    <EventDashboard />
                </BrowserRouter>
            </AuthContext.Provider>
        );
    };

    test('shows loading state initially and then renders events', async () => {
        renderWithContext();

        // Initially we should see the loading spinner/text
        expect(screen.getByText(/Igniting Campus Life/i)).toBeInTheDocument();

        // After fetch completes, events should be visible
        await waitFor(() => {
            expect(screen.getByText('Tech Career Fair 2026')).toBeInTheDocument();
            expect(screen.getByText('AI Workshop')).toBeInTheDocument();
        });

        // Ensure APIs were called
        expect(eventService.getAllEvents).toHaveBeenCalledTimes(1);
        expect(eventService.getMyRegistrations).toHaveBeenCalledTimes(1);
    });

    test('filters events based on search query', async () => {
        const user = userEvent.setup();
        renderWithContext();

        await waitFor(() => {
            expect(screen.getByText('Tech Career Fair 2026')).toBeInTheDocument();
        });

        // Find the search input
        const searchInput = screen.getByPlaceholderText(/Search Events/i);
        
        // Type a search query that matches only one event
        await user.type(searchInput, 'Career');

        await waitFor(() => {
            expect(screen.getByText('Tech Career Fair 2026')).toBeInTheDocument();
            // Assuming the EventCard uses the title somewhere textually
            expect(screen.queryByText('AI Workshop')).not.toBeInTheDocument();
        });
    });

    test('opens request idea modal and submits a new event pitch', async () => {
        eventRequestService.createRequest.mockResolvedValue({ data: { success: true } });
        const user = userEvent.setup();
        renderWithContext();

        await waitFor(() => {
            expect(screen.getByText('Tech Career Fair 2026')).toBeInTheDocument();
        });

        // Click on the "Request Idea" button
        const requestBtn = screen.getByRole('button', { name: /Request Idea/i });
        await user.click(requestBtn);

        // Fill out the form in the modal
        const titleInput = await screen.findByPlaceholderText(/Next-Gen Robotics Hackathon/i);
        await user.type(titleInput, 'New Web3 Tech Meetup');

        const categorySelect = screen.getAllByRole('combobox').find(el => el.value === '');
        await user.selectOptions(categorySelect, 'Seminar');

        const descriptionInput = screen.getByPlaceholderText(/What's the core goal/i);
        await user.type(descriptionInput, 'A great idea for students.');

        // Submit the pitch
        const submitBtn = screen.getByRole('button', { name: /Launch Pitch/i });
        await user.click(submitBtn);

        // Verify the API was called with the right data
        expect(eventRequestService.createRequest).toHaveBeenCalledWith({
            title: 'New Web3 Tech Meetup',
            category: 'Seminar',
            description: 'A great idea for students.'
        });
    });
});
