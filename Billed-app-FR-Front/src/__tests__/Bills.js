/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    document.body.innerHTML = BillsUI({ data: bills })

    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon.classList.contains("active-icon")).toBe(true)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })


    describe("When I click on eye icon of one of the listed bills", () => {
      test("Then a modal should appear", async () => {
        document.body.innerHTML = ""
        document.body.innerHTML = BillsUI({ data: bills })
        const billsInstance = new Bills({ document, onNavigate: jest.fn(), store: null, localStorage: window.localStorage });
        const handleClickIconEye = jest.fn(bills.handleClickIconEye);
        const iconEye = screen.getAllByTestId('icon-eye')[0];
        iconEye.addEventListener('click', handleClickIconEye)
        userEvent.click(iconEye)

        const billUrl = iconEye.getAttribute("data-bill-url")
        expect(billUrl).toBeTruthy();

        const iconEyeURL = iconEye.getAttribute("data-bill-url")
        expect(iconEyeURL).toEqual(bills[0].fileUrl)
        expect(handleClickIconEye).toHaveBeenCalled()

        billsInstance.handleClickIconEye(iconEye);
        await waitFor(() => screen.getByTestId('modaleFile'))
        const modale = screen.getByTestId('modaleFile')

        await waitFor(() => {
          expect($(modale).hasClass('show')).toBeTruthy()

        })
      })
    })
  })
})

test('handleClickNewBill calls onNavigate with correct route', () => {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock })
  window.localStorage.setItem('user', JSON.stringify({
    type: 'Employee'
  }))
  document.body.innerHTML = BillsUI({ data: bills })
  const store = null
  const instance = new Bills({ document, onNavigate, store, localStorage: window.localStorage })

  const mockOnNavigate = jest.fn();
  instance.onNavigate = mockOnNavigate;
  instance.handleClickNewBill();

  expect(mockOnNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
});


// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Dashboard", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "employee@test.tld" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const headerNotes = await screen.getByText("Mes notes de frais")
      expect(headerNotes).toBeTruthy()
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "employee@test.tld"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })

  })
})
